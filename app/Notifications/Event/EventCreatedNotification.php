<?php

namespace App\Notifications\Event;

use App\Models\Event;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EventCreatedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Event $event,
        public readonly User $createdBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $start = optional($this->event->start_date)->toDateTimeString();

        return [
            'kind' => 'event_created',
            'level' => 'info',
            'title' => 'New event created',
            'body' => "{$this->createdBy->name} created “{$this->event->title}” (starts {$start}).",
            'action_url' => '/event',
            'meta' => [
                'event_id' => $this->event->id,
                'created_by' => $this->createdBy->id,
                'start_date' => $start,
            ],
        ];
    }
}
