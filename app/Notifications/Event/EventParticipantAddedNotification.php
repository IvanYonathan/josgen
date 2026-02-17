<?php

namespace App\Notifications\Event;

use App\Models\Event;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EventParticipantAddedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Event $event,
        public readonly User $addedBy,
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
            'kind' => 'event_participant_added',
            'level' => 'info',
            'title' => 'Added to event',
            'body' => "{$this->addedBy->name} added you to “{$this->event->title}” (starts {$start}).",
            'action_url' => '/event',
            'meta' => [
                'event_id' => $this->event->id,
                'added_by' => $this->addedBy->id,
                'start_date' => $start,
            ],
        ];
    }
}
