<?php

namespace App\Http\Controllers\Api;

use App\Models\TodoList;
use App\Models\TodoItem;
use App\Notifications\TodoItem\TodoItemAssignedNotification;
use App\Notifications\TodoItem\TodoItemCompletedNotification;
use App\Notifications\TodoItem\TodoItemUnassignedNotification;
use App\Models\User;
use App\Traits\SyncsGoogleCalendar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class TodoListController extends ApiController
{
    use SyncsGoogleCalendar;
    /**
     * Get a paginated list of todo lists (personal or division).
     */
    public function list(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => ['nullable', Rule::in(['personal', 'division'])],
            'division_id' => 'nullable|integer|exists:divisions,id',
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:100',
            'filters' => 'nullable|array',
            'filters.search' => 'nullable|string',
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
        $type = $validated['type'] ?? null;

        // Get user's division IDs from the many-to-many relationship
        $userDivisionIds = $user->divisions->pluck('id')->toArray();

        // Base query: personal lists owned by user OR division lists for user's divisions
        $query = TodoList::query()
            ->where(function ($q) use ($user, $userDivisionIds) {
                // Personal lists: owned by user
                $q->where(function ($subQ) use ($user) {
                    $subQ->where('type', 'personal')
                         ->where('user_id', $user->id);
                })
                // OR Division lists: user is member of the division
                ->orWhere(function ($subQ) use ($userDivisionIds) {
                    $subQ->where('type', 'division')
                         ->whereIn('division_id', $userDivisionIds);
                });
            })
            ->with(['user:id,name', 'division:id,name', 'items']);

        // Filter by type (personal or division)
        if ($type) {
            $query->where('type', $type);
        }

        // Filter by division_id (for division todo lists)
        if (!empty($validated['division_id'])) {
            $query->where('division_id', $validated['division_id']);
        }

        // Search in title
        if (!empty($filters['search'])) {
            $search = mb_strtolower(trim($filters['search']));
            $query->whereRaw('LOWER(title) LIKE ?', ["%{$search}%"]);
        }

        $sortableColumns = [
            'title' => 'title',
            'type' => 'type',
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

        // Default sorting: by updated_at desc
        if (!$appliedSort) {
            $query->orderBy('updated_at', 'desc');
        }

        $total = (clone $query)->count();

        $page = max(1, $page);
        $offset = ($page - 1) * $limit;

        $todoLists = (clone $query)
            ->skip($offset)
            ->take($limit)
            ->get();

        // Add computed fields for each list
        $todoLists->each(function ($list) {
            $list->total_items = $list->items->count();
            $list->completed_items = $list->items->where('completed', true)->count();
        });

        return $this->success([
            'todo_lists' => $todoLists,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'has_next_page' => ($offset + $limit) < $total,
            ],
        ], 'Todo lists retrieved successfully', $total);
    }

    /**
     * Get a single todo list by ID with its items.
     */
    public function get(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:todo_lists,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $userDivisionIds = $user->divisions->pluck('id')->toArray();

        $todoList = TodoList::where('id', $request->id)
            ->where(function ($q) use ($user, $userDivisionIds) {
                // Personal lists: owned by user
                $q->where(function ($subQ) use ($user) {
                    $subQ->where('type', 'personal')
                         ->where('user_id', $user->id);
                })
                // OR Division lists: user is member of the division
                ->orWhere(function ($subQ) use ($userDivisionIds) {
                    $subQ->where('type', 'division')
                         ->whereIn('division_id', $userDivisionIds);
                });
            })
            ->with(['user:id,name', 'division:id,name', 'items.assignedTo:id,name'])
            ->first();

        if (!$todoList) {
            return $this->notFound('Todo list not found or you do not have permission to view it');
        }

        // Add computed fields
        $todoList->total_items = $todoList->items->count();
        $todoList->completed_items = $todoList->items->where('completed', true)->count();

        return $this->success(['todo_list' => $todoList], 'Todo list retrieved successfully');
    }

    /**
     * Create a new todo list.
     */
    public function create(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => ['required', Rule::in(['personal', 'division'])],
            'division_id' => 'nullable|integer|exists:divisions,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $validated = $validator->validated();

        // If type is division, division_id is required
        if ($validated['type'] === 'division' && empty($validated['division_id'])) {
            return $this->validationError(['division_id' => ['Division ID is required for division todo lists']]);
        }

        // If type is personal, division_id should be null
        if ($validated['type'] === 'personal') {
            $validated['division_id'] = null;
        }

        $todoList = TodoList::create([
            'title' => $validated['title'],
            'type' => $validated['type'],
            'user_id' => Auth::id(),
            'division_id' => $validated['division_id'] ?? null,
        ]);

        $todoList->load(['user:id,name', 'division:id,name', 'items']);
        $todoList->total_items = 0;
        $todoList->completed_items = 0;

        return $this->success(['todo_list' => $todoList], 'Todo list created successfully');
    }

    /**
     * Update an existing todo list.
     */
    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:todo_lists,id',
            'title' => 'nullable|string|max:255',
            'division_id' => 'nullable|integer|exists:divisions,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $userDivisionIds = $user->divisions->pluck('id')->toArray();

        $todoList = TodoList::where('id', $request->id)
            ->where(function ($q) use ($user, $userDivisionIds) {
                // Personal lists: owned by user
                $q->where(function ($subQ) use ($user) {
                    $subQ->where('type', 'personal')
                         ->where('user_id', $user->id);
                })
                // OR Division lists: user is member of the division
                ->orWhere(function ($subQ) use ($userDivisionIds) {
                    $subQ->where('type', 'division')
                         ->whereIn('division_id', $userDivisionIds);
                });
            })
            ->first();

        if (!$todoList) {
            return $this->notFound('Todo list not found or you do not have permission to update it');
        }

        $validated = $validator->validated();

        if (isset($validated['title'])) {
            $todoList->title = $validated['title'];
        }

        if (isset($validated['division_id'])) {
            // Only allow changing division_id for division type lists
            if ($todoList->type === 'division') {
                $todoList->division_id = $validated['division_id'];
            }
        }

        $todoList->save();
        $todoList->load(['user:id,name', 'division:id,name', 'items.assignedTo:id,name']);

        // Add computed fields
        $todoList->total_items = $todoList->items->count();
        $todoList->completed_items = $todoList->items->where('completed', true)->count();

        return $this->success(['todo_list' => $todoList], 'Todo list updated successfully');
    }

    /**
     * Delete a todo list.
     */
    public function delete(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:todo_lists,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $userDivisionIds = $user->divisions->pluck('id')->toArray();

        $todoList = TodoList::where('id', $request->id)
            ->where(function ($q) use ($user, $userDivisionIds) {
                // Personal lists: owned by user
                $q->where(function ($subQ) use ($user) {
                    $subQ->where('type', 'personal')
                         ->where('user_id', $user->id);
                })
                // OR Division lists: user is member of the division
                ->orWhere(function ($subQ) use ($userDivisionIds) {
                    $subQ->where('type', 'division')
                         ->whereIn('division_id', $userDivisionIds);
                });
            })
            ->first();

        if (!$todoList) {
            return $this->notFound('Todo list not found or you do not have permission to delete it');
        }

        $todoList->delete();

        return $this->success(null, 'Todo list deleted successfully');
    }

    /**
     * Add a new item to a todo list.
     */
    public function addItem(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'todo_list_id' => 'required|integer|exists:todo_lists,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'assigned_to' => 'nullable|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $userDivisionIds = $user->divisions->pluck('id')->toArray();

        // Check if user has access to the todo list
        $todoList = TodoList::where('id', $request->todo_list_id)
            ->where(function ($q) use ($user, $userDivisionIds) {
                // Personal lists: owned by user
                $q->where(function ($subQ) use ($user) {
                    $subQ->where('type', 'personal')
                         ->where('user_id', $user->id);
                })
                // OR Division lists: user is member of the division
                ->orWhere(function ($subQ) use ($userDivisionIds) {
                    $subQ->where('type', 'division')
                         ->whereIn('division_id', $userDivisionIds);
                });
            })
            ->first();

        if (!$todoList) {
            return $this->notFound('Todo list not found or you do not have permission to add items to it');
        }

        $validated = $validator->validated();

        $todoItem = TodoItem::create([
            'todo_list_id' => $validated['todo_list_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'priority' => $validated['priority'] ?? 'medium',
            'assigned_to' => $validated['assigned_to'] ?? null,
            'completed' => false,
        ]);

        $todoItem->load('assignedTo:id,name');

        if ($todoItem->assigned_to && $todoItem->assignedTo) {
            $todoItem->assignedTo->notify(new TodoItemAssignedNotification($todoItem, $todoList, $user));
        }

        // Sync to Google Calendar if assigned and has due date
        if ($todoItem->assigned_to && $todoItem->due_date) {
            $this->syncCalendarForUsers($todoItem, 'upsert', [$todoItem->assigned_to]);
        }

        return $this->success(['todo_item' => $todoItem], 'Todo item added successfully');
    }

    /**
     * Update a todo item.
     */
    public function updateItem(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:todo_items,id',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'nullable|boolean',
            'due_date' => 'nullable|date',
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'assigned_to' => 'nullable|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $userDivisionIds = $user->divisions->pluck('id')->toArray();

        $todoItem = TodoItem::whereHas('todoList', function ($query) use ($user, $userDivisionIds) {
            $query->where(function ($q) use ($user, $userDivisionIds) {
                // Personal lists: owned by user
                $q->where(function ($subQ) use ($user) {
                    $subQ->where('type', 'personal')
                         ->where('user_id', $user->id);
                })
                // OR Division lists: user is member of the division
                ->orWhere(function ($subQ) use ($userDivisionIds) {
                    $subQ->where('type', 'division')
                         ->whereIn('division_id', $userDivisionIds);
                });
            });
        })->find($request->id);

        if (!$todoItem) {
            return $this->notFound('Todo item not found or you do not have permission to update it');
        }

        $previousAssignedTo = $todoItem->assigned_to;

        $validated = $validator->validated();

        if (isset($validated['title'])) {
            $todoItem->title = $validated['title'];
        }

        if (isset($validated['description'])) {
            $todoItem->description = $validated['description'];
        }

        if (isset($validated['completed'])) {
            $todoItem->completed = $validated['completed'];
        }

        if (isset($validated['due_date'])) {
            $todoItem->due_date = $validated['due_date'];
        }

        if (isset($validated['priority'])) {
            $todoItem->priority = $validated['priority'];
        }

        if (isset($validated['assigned_to'])) {
            $todoItem->assigned_to = $validated['assigned_to'];
        }

        $todoItem->save();
        $todoItem->load('todoList:id,title,type,user_id,division_id', 'todoList.user:id,name', 'todoList.division.leader:id,name', 'assignedTo:id,name');

        if ($todoItem->wasChanged('assigned_to') && $todoItem->assigned_to && $todoItem->assigned_to !== $previousAssignedTo && $todoItem->assignedTo && $todoItem->todoList) {
            $todoItem->assignedTo->notify(new TodoItemAssignedNotification($todoItem, $todoItem->todoList, $user));
        }

        if ($todoItem->wasChanged('assigned_to') && $previousAssignedTo && $previousAssignedTo !== $todoItem->assigned_to && $todoItem->todoList) {
            $previousAssignee = User::find($previousAssignedTo);
            if ($previousAssignee && $previousAssignee->id !== $user->id) {
                $previousAssignee->notify(new TodoItemUnassignedNotification($todoItem, $todoItem->todoList, $user, $todoItem->assignedTo));
            }
        }

        if ($todoItem->wasChanged('completed') && $todoItem->completed && $todoItem->todoList) {
            $owner = $todoItem->todoList->user;
            if ($owner && $owner->id !== $user->id) {
                $owner->notify(new TodoItemCompletedNotification($todoItem, $todoItem->todoList, $user));
            }

            $leader = $todoItem->todoList->division?->leader;
            if ($leader && $leader->id !== $user->id) {
                $leader->notify(new TodoItemCompletedNotification($todoItem, $todoItem->todoList, $user));
            }
        }

        // Sync to Google Calendar - handle reassignment
        if ($todoItem->wasChanged('assigned_to') && $previousAssignedTo && $previousAssignedTo !== $todoItem->assigned_to) {
            $this->removeCalendarForUsers($todoItem, [$previousAssignedTo]);
        }
        if ($todoItem->assigned_to && $todoItem->due_date) {
            $this->syncCalendarForUsers($todoItem, 'upsert', [$todoItem->assigned_to]);
        }

        return $this->success(['todo_item' => $todoItem], 'Todo item updated successfully');
    }

    /**
     * Delete a todo item.
     */
    public function deleteItem(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:todo_items,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $userDivisionIds = $user->divisions->pluck('id')->toArray();

        $todoItem = TodoItem::whereHas('todoList', function ($query) use ($user, $userDivisionIds) {
            $query->where(function ($q) use ($user, $userDivisionIds) {
                // Personal lists: owned by user
                $q->where(function ($subQ) use ($user) {
                    $subQ->where('type', 'personal')
                         ->where('user_id', $user->id);
                })
                // OR Division lists: user is member of the division
                ->orWhere(function ($subQ) use ($userDivisionIds) {
                    $subQ->where('type', 'division')
                         ->whereIn('division_id', $userDivisionIds);
                });
            });
        })->find($request->id);

        if (!$todoItem) {
            return $this->notFound('Todo item not found or you do not have permission to delete it');
        }

        // Remove from Google Calendar before deletion
        if ($todoItem->assigned_to) {
            $this->removeCalendarForUsers($todoItem, [$todoItem->assigned_to]);
        }

        $todoItem->delete();

        return $this->success(null, 'Todo item deleted successfully');
    }

    /**
     * Toggle the completion status of one or multiple todo items.
     *
     * Supports both:
     * - Single toggle: { "id": 1 } or { "ids": [1] }
     * - Bulk toggle: { "ids": [1, 2, 3], "completed": true }
     */
    public function toggleItem(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'nullable|integer|exists:todo_items,id',
            'ids' => 'nullable|array',
            'ids.*' => 'integer|exists:todo_items,id',
            'completed' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
        $userDivisionIds = $user->divisions->pluck('id')->toArray();

        // Determine if single or multiple IDs
        $ids = [];
        if ($request->has('id')) {
            $ids = [$request->id];
        } elseif ($request->has('ids')) {
            $ids = $request->ids;
        } else {
            return $this->validationError(['id' => ['Either id or ids is required']]);
        }

        // Get all items that belong to the user's todo lists
        $todoItems = TodoItem::whereHas('todoList', function ($query) use ($user, $userDivisionIds) {
            $query->where(function ($q) use ($user, $userDivisionIds) {
                // Personal lists: owned by user
                $q->where(function ($subQ) use ($user) {
                    $subQ->where('type', 'personal')
                         ->where('user_id', $user->id);
                })
                // OR Division lists: user is member of the division
                ->orWhere(function ($subQ) use ($userDivisionIds) {
                    $subQ->where('type', 'division')
                         ->whereIn('division_id', $userDivisionIds);
                });
            });
        })
        ->whereIn('id', $ids)
        ->with(['todoList:id,title,type,user_id,division_id', 'todoList.user:id,name', 'todoList.division.leader:id,name', 'assignedTo:id,name'])
        ->get();

        if ($todoItems->isEmpty()) {
            return $this->notFound('No todo items found or you do not have permission to toggle them');
        }

        // Check if user owns all the items
        if ($todoItems->count() !== count($ids)) {
            return $this->notFound('Some todo items were not found or you do not have permission to toggle them');
        }

        // Toggle or set completion status
        $updatedItems = [];
        foreach ($todoItems as $item) {
            $previousCompleted = (bool) $item->completed;
            if ($request->has('completed')) {
                // Set to specific value
                $item->completed = $request->completed;
            } else {
                // Toggle
                $item->completed = !$item->completed;
            }
            $item->save();

            if ($item->completed && !$previousCompleted && $item->todoList) {
                $owner = $item->todoList->user;
                if ($owner && $owner->id !== $user->id) {
                    $owner->notify(new TodoItemCompletedNotification($item, $item->todoList, $user));
                }

                $leader = $item->todoList->division?->leader;
                if ($leader && $leader->id !== $user->id) {
                    $leader->notify(new TodoItemCompletedNotification($item, $item->todoList, $user));
                }
            }

            // Sync toggle to Google Calendar
            if ($item->assigned_to && $item->due_date) {
                $this->syncCalendarForUsers($item, 'upsert', [$item->assigned_to]);
            }

            $updatedItems[] = $item;
        }

        // Return appropriate response based on single or multiple
        if (count($updatedItems) === 1) {
            return $this->success(
                ['todo_item' => $updatedItems[0]],
                'Todo item toggled successfully'
            );
        } else {
            return $this->success(
                ['todo_items' => $updatedItems],
                count($updatedItems) . ' todo items toggled successfully'
            );
        }
    }
}
