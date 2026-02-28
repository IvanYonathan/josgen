<?php

namespace App\Notifications\Event;

use App\Models\Event;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EventCancelledNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Event $event,
        public readonly User $cancelledBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'event_cancelled',
            'level' => 'warning',
            'title' => 'Event cancelled',
            'body' => "{$this->cancelledBy->name} cancelled “{$this->event->title}”.",
            'action_url' => '/event',
            'meta' => [
                'event_id' => $this->event->id,
                'cancelled_by' => $this->cancelledBy->id,
            ],
        ];
    }
}
