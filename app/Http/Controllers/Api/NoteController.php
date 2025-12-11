<?php

namespace App\Http\Controllers\Api;

use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class NoteController extends ApiController
{
    /**
     * Get a paginated list of the authenticated user's notes.
     */
    public function list(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:100',
            'filters' => 'nullable|array',
            'filters.search' => 'nullable|string',
            'filters.category' => 'nullable|string',
            'filters.is_pinned' => 'nullable|boolean',
            'sort' => 'nullable|array',
            'sort.*' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $validated = $validator->validated();

        $page = (int) ($validated['page'] ?? 1);
        $limit = (int) min($validated['limit'] ?? 10, 100);
        $filters = $validated['filters'] ?? [];
        $sort = $validated['sort'] ?? [];

        $query = Note::query()
            ->where('user_id', Auth::id())
            ->with('user:id,name');

        // Search in title and content
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['is_pinned'])) {
            $query->where('is_pinned', $filters['is_pinned']);
        }
        
        $sortableColumns = [
            'title' => 'title',
            'category' => 'category',
            'is_pinned' => 'is_pinned',
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

        // Default sorting: pinned first, then by updated_at desc
        if (!$appliedSort) {
            $query->orderBy('is_pinned', 'desc')
                ->orderBy('updated_at', 'desc');
        }

        $total = (clone $query)->count();

        $page = max(1, $page);
        $offset = ($page - 1) * $limit;

        $notes = (clone $query)
            ->skip($offset)
            ->take($limit)
            ->get();

        return $this->success([
            'notes' => $notes,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'has_next_page' => ($offset + $limit) < $total,
            ],
        ], 'Notes retrieved successfully', $total);
    }

    /**
     * Get a single note by ID.
     */
    public function get(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:notes,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $note = Note::where('id', $request->id)
            ->where('user_id', Auth::id())
            ->with('user:id,name')
            ->first();

        if (!$note) {
            return $this->notFound('Note not found or you do not have permission to view it');
        }

        return $this->success(['note' => $note], 'Note retrieved successfully');
    }

    /**
     * Create a new note.
     */
    public function create(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'category' => 'nullable|string|max:100',
            'is_pinned' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $validated = $validator->validated();

        $note = Note::create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'user_id' => Auth::id(),
            'tags' => $validated['tags'] ?? null,
            'category' => $validated['category'] ?? null,
            'is_pinned' => $validated['is_pinned'] ?? false,
        ]);

        $note->load('user:id,name');

        return $this->success(['note' => $note], 'Note created successfully');
    }

    /**
     * Update an existing note.
     */
    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:notes,id',
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'category' => 'nullable|string|max:100',
            'is_pinned' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $note = Note::where('id', $request->id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$note) {
            return $this->notFound('Note not found or you do not have permission to update it');
        }

        $validated = $validator->validated();

        if (isset($validated['title'])) {
            $note->title = $validated['title'];
        }

        if (isset($validated['content'])) {
            $note->content = $validated['content'];
        }

        if (isset($validated['tags'])) {
            $note->tags = $validated['tags'];
        }

        if (isset($validated['category'])) {
            $note->category = $validated['category'];
        }

        if (isset($validated['is_pinned'])) {
            $note->is_pinned = $validated['is_pinned'];
        }

        $note->save();
        $note->load('user:id,name');

        return $this->success(['note' => $note], 'Note updated successfully');
    }

    /**
     * Delete a note.
     */
    public function delete(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:notes,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $note = Note::where('id', $request->id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$note) {
            return $this->notFound('Note not found or you do not have permission to delete it');
        }

        $note->delete();

        return $this->success(null, 'Note deleted successfully');
    }
}
