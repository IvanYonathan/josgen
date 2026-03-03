<?php

namespace App\Traits;

use App\Jobs\SyncCalendarItem;
use App\Models\GoogleCalendarToken;
use App\Models\TodoItem;
use Illuminate\Database\Eloquent\Model;

trait SyncsGoogleCalendar
{
    protected function syncCalendarForUsers(Model $model, string $action, array $userIds): void
    {
        if (empty($userIds)) {
            return;
        }

        $connectedUserIds = GoogleCalendarToken::whereIn('user_id', $userIds)
            ->pluck('user_id')
            ->toArray();

        foreach ($connectedUserIds as $userId) {
            SyncCalendarItem::dispatch(
                $userId,
                get_class($model),
                $model->id,
                $action
            );
        }
    }

    protected function removeCalendarForUsers(Model $model, array $userIds): void
    {
        $this->syncCalendarForUsers($model, 'delete', $userIds);
    }

    /**
     * Get the user ID to sync a todo item for.
     * Uses assigned_to if set, otherwise falls back to the list owner.
     */
    protected function getTodoItemSyncUserId(TodoItem $item): ?int
    {
        if ($item->assigned_to) {
            return $item->assigned_to;
        }

        $item->loadMissing('todoList');
        return $item->todoList?->user_id;
    }
}
