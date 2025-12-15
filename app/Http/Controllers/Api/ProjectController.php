<?php

namespace App\Http\Controllers\Api;

use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ProjectController extends ApiController
{
    /**
     * Get a paginated list of projects visible to the authenticated user.
     */
    public function list(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view projects', 'You do not have permission to view projects')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:100',
            'filters' => 'nullable|array',
            'filters.search' => 'nullable|string',
            'filters.status' => ['nullable', Rule::in(['planning', 'active', 'on_hold', 'completed', 'cancelled'])],
            'filters.division_id' => 'nullable|integer|exists:divisions,id',
            'sort' => 'nullable|array',
            'sort.*' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $validated = $validator->validated();
        $user = Auth::user();

        $page = (int) ($validated['page'] ?? 1);
        $limit = (int) min($validated['limit'] ?? 50, 100);
        $filters = $validated['filters'] ?? [];
        $sort = $validated['sort'] ?? [];

        // Base query: projects where user is manager, member, or user's division is assigned
        $query = Project::query()
            ->where(function ($q) use ($user) {
                $q->where('manager_id', $user->id) // User is manager
                    ->orWhereHas('divisions', function ($subQ) use ($user) {
                        $subQ->where('divisions.id', $user->division_id); // User's division assigned
                    })
                    ->orWhereHas('members', function ($subQ) use ($user) {
                        $subQ->where('users.id', $user->id); // User is member
                    });
            })
            ->with(['manager:id,name', 'divisions:id,name', 'members:id,name'])
            ->withCount(['members', 'tasks']);

        // Apply filters
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (!empty($filters['division_id'])) {
            $query->whereHas('divisions', function ($q) use ($filters) {
                $q->where('divisions.id', $filters['division_id']);
            });
        }

        // Apply sorting
        $appliedSort = false;
        if (!empty($sort)) {
            foreach ($sort as $field => $direction) {
                if (in_array($field, ['name', 'start_date', 'end_date', 'progress', 'created_at'])) {
                    $query->orderBy($field, $direction);
                    $appliedSort = true;
                }
            }
        }

        // Default sort: priority by status (planning -> active -> on_hold -> completed -> cancelled)
        if (!$appliedSort) {
            $query->orderByRaw("CASE
                WHEN status = 'active' THEN 1
                WHEN status = 'planning' THEN 2
                WHEN status = 'on_hold' THEN 3
                WHEN status = 'completed' THEN 4
                WHEN status = 'cancelled' THEN 5
                ELSE 6
            END")->orderBy('start_date', 'desc');
        }

        // Pagination
        $offset = ($page - 1) * $limit;
        $total = (clone $query)->count();
        $projects = (clone $query)->skip($offset)->take($limit)->get();

        // Add computed fields
        $projects->each(function ($project) use ($user) {
            $project->can_edit = $project->canBeEditedBy($user);
            $project->can_modify_members = $project->canModifyMembers();
        });

        return $this->success([
            'projects' => $projects,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'has_next_page' => ($offset + $limit) < $total,
            ],
        ], 'Projects retrieved successfully', $total);
    }

    /**
     * Get a single project by ID.
     */
    public function get(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view projects', 'You do not have permission to view projects')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $project = Project::with([
            'manager:id,name,email',
            'divisions:id,name',
            'members:id,name,email',
            'tasks.assignedUser:id,name'
        ])
        ->withCount(['members', 'tasks'])
        ->find($request->id);

        if (!$project) {
            return $this->notFound('Project not found');
        }

        // Check access: user must be manager, member, or in assigned division
        $hasAccess = $project->manager_id === $user->id
            || $project->members->contains('id', $user->id)
            || $project->divisions->contains('id', $user->division_id);

        if (!$hasAccess) {
            return $this->forbidden('You do not have access to this project');
        }

        $project->can_edit = $project->canBeEditedBy($user);
        $project->can_modify_members = $project->canModifyMembers();

        return $this->success(['project' => $project], 'Project retrieved successfully');
    }

    /**
     * Create a new project.
     */
    public function create(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('create projects', 'You do not have permission to create projects')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'division_ids' => 'required|array|min:1',
            'division_ids.*' => 'integer|exists:divisions,id',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $validated = $validator->validated();
        $user = Auth::user();

        // Create project with manager as current user
        $project = Project::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'status' => 'planning',
            'progress' => 0,
            'manager_id' => $user->id,
        ]);

        // Attach divisions
        $project->divisions()->attach($validated['division_ids']);

        // Attach members (validate they belong to assigned divisions)
        if (!empty($validated['member_ids'])) {
            $divisionIds = $validated['division_ids'];
            $validMemberIds = User::whereIn('id', $validated['member_ids'])
                ->whereIn('division_id', $divisionIds)
                ->pluck('id')
                ->toArray();

            if (!empty($validMemberIds)) {
                $project->members()->attach($validMemberIds);
            }
        }

        // Reload with relationships
        $project->load(['manager:id,name', 'divisions:id,name', 'members:id,name', 'tasks']);
        $project->can_edit = $project->canBeEditedBy($user);
        $project->can_modify_members = $project->canModifyMembers();

        return $this->success(['project' => $project], 'Project created successfully');
    }

    /**
     * Update an existing project.
     */
    public function update(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('edit projects', 'You do not have permission to edit projects')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:projects,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'nullable|date',
            'status' => ['sometimes', 'required', Rule::in(['planning', 'active', 'on_hold', 'completed', 'cancelled'])],
            'division_ids' => 'sometimes|required|array|min:1',
            'division_ids.*' => 'integer|exists:divisions,id',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $validated = $validator->validated();
        $user = Auth::user();

        $project = Project::with(['divisions', 'members', 'tasks'])->find($validated['id']);

        if (!$project) {
            return $this->notFound('Project not found');
        }

        // Check permission
        if (!$project->canBeEditedBy($user)) {
            return $this->forbidden('You do not have permission to edit this project');
        }

        // Update fields
        if (isset($validated['name'])) $project->name = $validated['name'];
        if (isset($validated['description'])) $project->description = $validated['description'];
        if (isset($validated['start_date'])) $project->start_date = $validated['start_date'];
        if (isset($validated['end_date'])) $project->end_date = $validated['end_date'];
        if (isset($validated['status'])) $project->status = $validated['status'];

        // Validate end_date >= start_date if both present
        if ($project->end_date && $project->start_date && $project->end_date < $project->start_date) {
            return $this->error('End date must be after or equal to start date', null, 400);
        }

        $project->save();

        // Sync divisions if provided
        if (isset($validated['division_ids'])) {
            $project->divisions()->sync($validated['division_ids']);
        }

        // Sync members if provided and status allows
        if (isset($validated['member_ids'])) {
            if (!$project->canModifyMembers()) {
                return $this->error('Members cannot be modified because the project status is ' . $project->status, null, 400);
            }

            $divisionIds = $project->divisions->pluck('id')->toArray();
            $validMemberIds = User::whereIn('id', $validated['member_ids'])
                ->whereIn('division_id', $divisionIds)
                ->pluck('id')
                ->toArray();

            $project->members()->sync($validMemberIds);
        }

        // Recalculate progress
        $project->calculateProgress();

        // Reload
        $project->load(['manager:id,name', 'divisions:id,name', 'members:id,name', 'tasks']);
        $project->can_edit = $project->canBeEditedBy($user);
        $project->can_modify_members = $project->canModifyMembers();

        return $this->success(['project' => $project], 'Project updated successfully');
    }

    /**
     * Delete a project.
     */
    public function delete(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('delete projects', 'You do not have permission to delete projects')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $project = Project::find($request->id);

        if (!$project) {
            return $this->notFound('Project not found');
        }

        // Only manager can delete
        if ($project->manager_id !== $user->id) {
            return $this->forbidden('Only the project manager can delete this project');
        }

        $project->delete();

        return $this->success(null, 'Project deleted successfully');
    }

    /**
     * Add members to a project (bulk operation).
     */
    public function addMembers(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('edit projects', 'You do not have permission to edit projects')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'project_id' => 'required|integer|exists:projects,id',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $project = Project::with(['divisions', 'members'])->find($request->project_id);

        if (!$project) {
            return $this->notFound('Project not found');
        }

        // Check permission
        if (!$project->canBeEditedBy($user)) {
            return $this->forbidden('You do not have permission to edit this project');
        }

        // Check if members can be modified
        if (!$project->canModifyMembers()) {
            return $this->error('Members cannot be modified because the project status is ' . $project->status, null, 400);
        }

        // Validate users belong to assigned divisions
        $divisionIds = $project->divisions->pluck('id')->toArray();
        $validUserIds = [];

        foreach ($request->user_ids as $userId) {
            $targetUser = User::find($userId);
            if ($targetUser && in_array($targetUser->division_id, $divisionIds)) {
                $validUserIds[] = $userId;
            }
        }

        if (empty($validUserIds)) {
            return $this->error('None of the specified users belong to the assigned divisions', null, 400);
        }

        // Get new members only (prevent duplicates)
        $existingIds = $project->members->pluck('id')->toArray();
        $newMemberIds = array_diff($validUserIds, $existingIds);

        if (empty($newMemberIds)) {
            return $this->error('All specified users are already members', null, 400);
        }

        // Attach new members
        $project->members()->attach($newMemberIds);

        // Reload
        $project->load(['manager:id,name', 'divisions:id,name', 'members:id,name']);
        $project->can_edit = $project->canBeEditedBy($user);
        $project->can_modify_members = $project->canModifyMembers();

        return $this->success(['project' => $project], count($newMemberIds) . ' member(s) added successfully');
    }

    /**
     * Remove members from a project (bulk operation).
     */
    public function removeMembers(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('edit projects', 'You do not have permission to edit projects')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'project_id' => 'required|integer|exists:projects,id',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $project = Project::with(['divisions', 'members'])->find($request->project_id);

        if (!$project) {
            return $this->notFound('Project not found');
        }

        // Check permission
        if (!$project->canBeEditedBy($user)) {
            return $this->forbidden('You do not have permission to edit this project');
        }

        // Check if members can be modified
        if (!$project->canModifyMembers()) {
            return $this->error('Members cannot be modified because the project status is ' . $project->status, null, 400);
        }

        // Detach members
        $project->members()->detach($request->user_ids);

        // Reload
        $project->load(['manager:id,name', 'divisions:id,name', 'members:id,name']);
        $project->can_edit = $project->canBeEditedBy($user);
        $project->can_modify_members = $project->canModifyMembers();

        return $this->success(['project' => $project], count($request->user_ids) . ' member(s) removed successfully');
    }

    /**
     * Create a task for a project.
     */
    public function createTask(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|integer|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'assigned_to' => 'nullable|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $project = Project::with('members')->find($request->project_id);

        if (!$project) {
            return $this->notFound('Project not found');
        }

        // Only manager can create tasks
        if ($project->manager_id !== $user->id) {
            return $this->forbidden('Only the project manager can create tasks');
        }

        // Validate assigned_to is a member
        if ($request->assigned_to) {
            $isMember = $project->members->contains('id', $request->assigned_to);
            if (!$isMember && $request->assigned_to !== $project->manager_id) {
                return $this->error('Assigned user must be a project member or the manager', null, 400);
            }
        }

        $task = ProjectTask::create([
            'project_id' => $project->id,
            'title' => $request->title,
            'description' => $request->description,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'assigned_to' => $request->assigned_to,
            'is_completed' => false,
        ]);

        $task->load('assignedUser:id,name');

        // Recalculate progress
        $project->calculateProgress();

        return $this->success(['task' => $task], 'Task created successfully');
    }

    /**
     * Update a project task.
     */
    public function updateTask(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:project_tasks,id',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'assigned_to' => 'nullable|integer|exists:users,id',
            'is_completed' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $task = ProjectTask::with('project.members')->find($request->id);

        if (!$task) {
            return $this->notFound('Task not found');
        }

        $project = $task->project;

        // Only manager can update tasks
        if ($project->manager_id !== $user->id) {
            return $this->forbidden('Only the project manager can update tasks');
        }

        // Update fields
        if ($request->has('title')) $task->title = $request->title;
        if ($request->has('description')) $task->description = $request->description;
        if ($request->has('start_date')) $task->start_date = $request->start_date;
        if ($request->has('end_date')) $task->end_date = $request->end_date;
        if ($request->has('assigned_to')) {
            // Validate assigned_to is a member
            if ($request->assigned_to) {
                $isMember = $project->members->contains('id', $request->assigned_to);
                if (!$isMember && $request->assigned_to !== $project->manager_id) {
                    return $this->error('Assigned user must be a project member or the manager', null, 400);
                }
            }
            $task->assigned_to = $request->assigned_to;
        }
        if ($request->has('is_completed')) $task->is_completed = $request->is_completed;

        $task->save();
        $task->load('assignedUser:id,name');

        // Recalculate progress
        $project->calculateProgress();

        return $this->success(['task' => $task], 'Task updated successfully');
    }

    /**
     * Delete a project task.
     */
    public function deleteTask(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:project_tasks,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $task = ProjectTask::with('project')->find($request->id);

        if (!$task) {
            return $this->notFound('Task not found');
        }

        $project = $task->project;

        // Only manager can delete tasks
        if ($project->manager_id !== $user->id) {
            return $this->forbidden('Only the project manager can delete tasks');
        }

        $task->delete();

        // Recalculate progress
        $project->calculateProgress();

        return $this->success(null, 'Task deleted successfully');
    }

    /**
     * Toggle task completion status (bulk operation).
     * Accepts multiple task IDs and toggles them all.
     */
    public function toggleTaskCompletion(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'task_ids' => 'required|array|min:1',
            'task_ids.*' => 'integer|exists:project_tasks,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $taskIds = $request->task_ids;

        // Fetch all tasks with their projects
        $tasks = ProjectTask::with('project')->whereIn('id', $taskIds)->get();

        if ($tasks->isEmpty()) {
            return $this->notFound('No tasks found');
        }

        // Check permission for each task and group by project
        $projectIds = [];
        foreach ($tasks as $task) {
            $project = $task->project;

            // Only manager can toggle task completion
            if ($project->manager_id !== $user->id) {
                return $this->forbidden('Only the project manager can mark tasks as complete');
            }

            $projectIds[] = $project->id;
        }

        // Toggle completion status for all tasks
        foreach ($tasks as $task) {
            $task->is_completed = !$task->is_completed;
            $task->save();
        }

        // Recalculate progress for affected projects
        $uniqueProjectIds = array_unique($projectIds);
        foreach ($uniqueProjectIds as $projectId) {
            $project = Project::find($projectId);
            if ($project) {
                $project->calculateProgress();
            }
        }

        // Reload tasks with assignedUser
        $tasks->load('assignedUser:id,name');

        return $this->success([
            'tasks' => $tasks,
            'toggled_count' => $tasks->count(),
        ], $tasks->count() . ' task(s) completion toggled successfully');
    }
}
