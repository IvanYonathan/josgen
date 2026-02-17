<?php

namespace App\Notifications\Event;

use App\Models\Event;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EventUpdatedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Event $event,
        public readonly User $updatedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'event_updated',
            'level' => 'info',
            'title' => 'Event updated',
            'body' => "{$this->updatedBy->name} updated “{$this->event->title}”.",
            'action_url' => '/event',
            'meta' => [
                'event_id' => $this->event->id,
                'updated_by' => $this->updatedBy->id,
                'start_date' => optional($this->event->start_date)->toDateTimeString(),
            ],
        ];
    }
}
