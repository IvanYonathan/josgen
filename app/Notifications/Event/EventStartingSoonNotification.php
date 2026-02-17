<?php

namespace App\Notifications\Event;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EventStartingSoonNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Event $event,
        public readonly int $minutesUntilStart,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $start = optional($this->event->start_date)->toDateTimeString();
        $inText = $this->minutesUntilStart === 60 ? 'in 1 hour' : "in {$this->minutesUntilStart} minutes";

        return [
            'kind' => 'event_starting_soon',
            'level' => 'warning',
            'title' => 'Event starting soon',
            'body' => "“{$this->event->title}” starts {$inText} ({$start}).",
            'action_url' => '/event',
            'meta' => [
                'event_id' => $this->event->id,
                'minutes_until_start' => $this->minutesUntilStart,
                'start_date' => $start,
            ],
        ];
    }
}
