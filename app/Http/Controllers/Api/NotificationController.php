<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class NotificationController extends ApiController
{
    public function list(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:100',
            'unread_only' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $validated = $validator->validated();
        $user = Auth::user();

        $page = (int) ($validated['page'] ?? 1);
        $limit = (int) min($validated['limit'] ?? 20, 100);
        $unreadOnly = (bool) ($validated['unread_only'] ?? false);

        $query = $user->notifications()->latest();

        if ($unreadOnly) {
            $query->whereNull('read_at');
        }

        $total = (clone $query)->count();
        $offset = ($page - 1) * $limit;

        $notifications = (clone $query)
            ->skip($offset)
            ->take($limit)
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->id,
                    'type' => $n->type,
                    'data' => $n->data,
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at,
                ];
            });

        $unreadCount = $user->unreadNotifications()->count();

        return $this->success([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'has_next_page' => ($offset + $limit) < $total,
            ],
        ], 'Notifications retrieved successfully', $total);
    }

    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();

        return $this->success([
            'unread_count' => $user->unreadNotifications()->count(),
        ], 'Unread notification count retrieved successfully');
    }

    public function markRead(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'nullable|string',
            'ids' => 'nullable|array',
            'ids.*' => 'string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();

        $ids = [];
        if ($request->filled('id')) {
            $ids = [$request->id];
        } elseif ($request->filled('ids')) {
            $ids = $request->ids;
        } else {
            return $this->validationError(['id' => ['Either id or ids is required']]);
        }

        $updated = $user->unreadNotifications()
            ->whereIn('id', $ids)
            ->update(['read_at' => now()]);

        return $this->success([
            'marked_read' => $updated,
            'unread_count' => $user->unreadNotifications()->count(),
        ], 'Notification(s) marked as read');
    }

    public function markAllRead(): JsonResponse
    {
        $user = Auth::user();

        $updated = $user->unreadNotifications()->update(['read_at' => now()]);

        return $this->success([
            'marked_read' => $updated,
            'unread_count' => 0,
        ], 'All notifications marked as read');
    }

    public function clearAll(): JsonResponse
    {
        $user = Auth::user();

        $deleted = $user->notifications()->delete();

        return $this->success([
            'deleted' => $deleted,
        ], 'All notifications cleared');
    }
}

