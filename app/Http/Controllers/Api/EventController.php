<?php

namespace App\Http\Controllers\Api;

use App\Models\Event;
use App\Models\Division;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EventController extends ApiController
{
    /**
     * Get a paginated list of events visible to the authenticated user.
     */
    public function list(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view events', 'You do not have permission to view events')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:100',
            'filters' => 'nullable|array',
            'filters.search' => 'nullable|string',
            'filters.status' => ['nullable', Rule::in(['upcoming', 'ongoing', 'completed', 'cancelled'])],
            'filters.division_id' => 'nullable|integer|exists:divisions,id',
            'filters.start_date' => 'nullable|date',
            'filters.end_date' => 'nullable|date',
            'sort' => 'nullable|array',
            'sort.*' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $validated = $validator->validated();
        $user = Auth::user();

        $page = (int) ($validated['page'] ?? 1);
        $limit = (int) min($validated['limit'] ?? 10, 100);
        $filters = $validated['filters'] ?? [];
        $sort = $validated['sort'] ?? [];

        // Base query: events where user is organizer or user's division is assigned
        $query = Event::query()
            ->where(function ($q) use ($user) {
                $q->where('organizer_id', $user->id)
                    ->orWhereHas('divisions', function ($subQ) use ($user) {
                        $subQ->where('divisions.id', $user->division_id);
                    });
            })
            ->with(['organizer:id,name', 'divisions:id,name', 'participants:id,name']);

        // Search in title and description
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['division_id'])) {
            $query->whereHas('divisions', function ($q) use ($filters) {
                $q->where('divisions.id', $filters['division_id']);
            });
        }

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->whereBetween('start_date', [$filters['start_date'], $filters['end_date']]);
        }

        $sortableColumns = [
            'title' => 'title',
            'start_date' => 'start_date',
            'end_date' => 'end_date',
            'status' => 'status',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];

        $appliedSort = false;
        foreach ($sort as $field => $direction) {
            if (isset($sortableColumns[$field])) {
                $query->orderBy(
                    $sortableColumns[$field],
                    strtolower($direction) === 'asc' ? 'asc' : 'desc'
                );
                $appliedSort = true;
            }
        }

        // Default sorting: upcoming first, then by start_date ascending
        if (!$appliedSort) {
            $query->orderByRaw("CASE
                WHEN status = 'upcoming' THEN 1
                WHEN status = 'ongoing' THEN 2
                WHEN status = 'completed' THEN 3
                WHEN status = 'cancelled' THEN 4
                ELSE 5
            END")
                ->orderBy('start_date', 'asc');
        }

        $total = (clone $query)->count();

        $page = max(1, $page);
        $offset = ($page - 1) * $limit;

        $events = (clone $query)
            ->skip($offset)
            ->take($limit)
            ->get();

        // Add can_edit flag to each event
        $events->each(function ($event) use ($user) {
            $event->can_edit = $event->canBeEditedBy($user);
            $event->can_modify_participants = $event->canModifyParticipants();
            $event->participants_count = $event->participants->count();
        });

        return $this->success([
            'events' => $events,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'has_next_page' => ($offset + $limit) < $total,
            ],
        ], 'Events retrieved successfully', $total);
    }

    /**
     * Get a single event by ID.
     */
    public function get(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view events', 'You do not have permission to view events')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:events,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();

        $event = Event::where(function ($q) use ($user) {
                $q->where('organizer_id', $user->id)
                    ->orWhereHas('divisions', function ($subQ) use ($user) {
                        $subQ->where('divisions.id', $user->division_id);
                    });
            })
            ->with(['organizer:id,name', 'divisions:id,name', 'participants:id,name'])
            ->find($request->id);

        if (!$event) {
            return $this->notFound('Event not found or you do not have permission to view it');
        }

        $event->can_edit = $event->canBeEditedBy($user);
        $event->can_modify_participants = $event->canModifyParticipants();
        $event->participants_count = $event->participants->count();

        return $this->success(['event' => $event], 'Event retrieved successfully');
    }

    /**
     * Create a new event (requires 'create events' permission).
     */
    public function create(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('create events', 'You do not have permission to create events')) {
            return $response;
        }

        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'nullable|string|max:255',
            'division_ids' => 'required|array|min:1',
            'division_ids.*' => 'integer|exists:divisions,id',
            'participant_ids' => 'nullable|array',
            'participant_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $validated = $validator->validated();

        $event = Event::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'location' => $validated['location'] ?? null,
            'status' => 'upcoming',
            'organizer_id' => $user->id,
        ]);

        // Attach divisions
        $event->divisions()->attach($validated['division_ids']);

        // Attach participants if provided
        if (!empty($validated['participant_ids'])) {
            $event->participants()->attach($validated['participant_ids']);
        }

        $event->load(['organizer:id,name', 'divisions:id,name', 'participants:id,name']);
        $event->can_edit = $event->canBeEditedBy($user);
        $event->can_modify_participants = $event->canModifyParticipants();
        $event->participants_count = $event->participants->count();

        return $this->success(['event' => $event], 'Event created successfully');
    }

    /**
     * Update an existing event (requires 'edit events' permission).
     */
    public function update(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('edit events', 'You do not have permission to edit events')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:events,id',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'location' => 'nullable|string|max:255',
            'division_ids' => 'nullable|array|min:1',
            'division_ids.*' => 'integer|exists:divisions,id',
            'participant_ids' => 'nullable|array',
            'participant_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();

        $event = Event::with(['divisions', 'participants'])
            ->find($request->id);

        if (!$event) {
            return $this->notFound('Event not found');
        }

        // Check if user can edit
        if (!$event->canBeEditedBy($user)) {
            return $this->forbidden('You do not have permission to edit this event');
        }

        $validated = $validator->validated();

        // Validate date range if both dates are provided
        if (isset($validated['start_date']) && isset($validated['end_date'])) {
            if (strtotime($validated['end_date']) < strtotime($validated['start_date'])) {
                return $this->validationError(['end_date' => ['End date must be after or equal to start date']]);
            }
        }

        if (isset($validated['title'])) {
            $event->title = $validated['title'];
        }

        if (isset($validated['description'])) {
            $event->description = $validated['description'];
        }

        if (isset($validated['start_date'])) {
            $event->start_date = $validated['start_date'];
        }

        if (isset($validated['end_date'])) {
            $event->end_date = $validated['end_date'];
        }

        if (isset($validated['location'])) {
            $event->location = $validated['location'];
        }

        $event->save();

        // Update divisions if provided
        if (isset($validated['division_ids'])) {
            $event->divisions()->sync($validated['division_ids']);
        }

        // Update participants if provided (only when status is 'upcoming')
        if (isset($validated['participant_ids']) && $event->canModifyParticipants()) {
            $event->participants()->sync($validated['participant_ids']);
        }

        $event->load(['organizer:id,name', 'divisions:id,name', 'participants:id,name']);
        $event->can_edit = $event->canBeEditedBy($user);
        $event->can_modify_participants = $event->canModifyParticipants();
        $event->participants_count = $event->participants->count();

        return $this->success(['event' => $event], 'Event updated successfully');
    }

    /**
     * Delete an event (requires 'delete events' permission + must be organizer).
     */
    public function delete(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('delete events', 'You do not have permission to delete events')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:events,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();

        $event = Event::find($request->id);

        if (!$event) {
            return $this->notFound('Event not found');
        }

        // Only organizer can delete
        if ($event->organizer_id !== $user->id) {
            return $this->forbidden('Only the event organizer can delete this event');
        }

        $event->delete();

        return $this->success(null, 'Event deleted successfully');
    }

    /**
     * Add participants to an event (requires 'edit events' permission, only when status is 'upcoming').
     */
    public function addParticipants(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('edit events', 'You do not have permission to modify event participants')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'event_id' => 'required|integer|exists:events,id',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();

        $event = Event::with(['divisions', 'participants'])->find($request->event_id);

        if (!$event) {
            return $this->notFound('Event not found');
        }

        // Check if user can edit
        if (!$event->canBeEditedBy($user)) {
            return $this->forbidden('You do not have permission to modify participants for this event');
        }

        // Check if event allows participant modifications
        if (!$event->canModifyParticipants()) {
            return $this->error('Participants can only be modified when event status is "upcoming"', null, 400);
        }

        // Validate that users belong to one of the event's divisions
        $eventDivisionIds = $event->divisions->pluck('id')->toArray();
        $validUserIds = [];
        $invalidUsers = [];

        foreach ($request->user_ids as $userId) {
            $targetUser = \App\Models\User::find($userId);
            if ($targetUser && in_array($targetUser->division_id, $eventDivisionIds)) {
                $validUserIds[] = $userId;
            } else {
                $invalidUsers[] = $userId;
            }
        }

        if (!empty($invalidUsers)) {
            return $this->validationError(
                ['user_ids' => ["Users with IDs " . implode(', ', $invalidUsers) . " do not belong to any of the event's divisions"]],
                'Some users cannot be added to this event'
            );
        }

        // Get already existing participants
        $existingParticipantIds = $event->participants->pluck('id')->toArray();
        $newParticipantIds = array_diff($validUserIds, $existingParticipantIds);

        if (empty($newParticipantIds)) {
            return $this->error('All specified users are already participants', null, 400);
        }

        // Attach new participants
        $event->participants()->attach($newParticipantIds);

        $event->load(['organizer:id,name', 'divisions:id,name', 'participants:id,name']);
        $event->can_edit = $event->canBeEditedBy($user);
        $event->can_modify_participants = $event->canModifyParticipants();
        $event->participants_count = $event->participants->count();

        return $this->success(
            ['event' => $event],
            count($newParticipantIds) . ' participant(s) added successfully'
        );
    }

    /**
     * Remove participants from an event (requires 'edit events' permission, only when status is 'upcoming').
     */
    public function removeParticipants(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('edit events', 'You do not have permission to modify event participants')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'event_id' => 'required|integer|exists:events,id',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();

        $event = Event::with(['divisions', 'participants'])->find($request->event_id);

        if (!$event) {
            return $this->notFound('Event not found');
        }

        // Check if user can edit
        if (!$event->canBeEditedBy($user)) {
            return $this->forbidden('You do not have permission to modify participants for this event');
        }

        // Check if event allows participant modifications
        if (!$event->canModifyParticipants()) {
            return $this->error('Participants can only be modified when event status is "upcoming"', null, 400);
        }

        // Detach participants
        $event->participants()->detach($request->user_ids);

        $event->load(['organizer:id,name', 'divisions:id,name', 'participants:id,name']);
        $event->can_edit = $event->canBeEditedBy($user);
        $event->can_modify_participants = $event->canModifyParticipants();
        $event->participants_count = $event->participants->count();

        return $this->success(
            ['event' => $event],
            count($request->user_ids) . ' participant(s) removed successfully'
        );
    }
}
