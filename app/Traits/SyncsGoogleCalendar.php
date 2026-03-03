<?php

namespace App\Traits;

use App\Jobs\SyncCalendarItem;
use App\Models\GoogleCalendarToken;
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
}
