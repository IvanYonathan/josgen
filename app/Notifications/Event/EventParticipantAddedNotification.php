<?php

namespace App\Notifications\Event;

use App\Models\Event;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventParticipantAddedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Event $event,
        public readonly User $addedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $start = optional($this->event->start_date)->toDateTimeString();

        return [
            'kind' => 'event_participant_added',
            'level' => 'info',
            'title' => 'Added to event',
            'body' => "{$this->addedBy->name} added you to \"{$this->event->title}\" (starts {$start}).",
            'action_url' => '/event',
            'meta' => [
                'event_id' => $this->event->id,
                'added_by' => $this->addedBy->id,
                'start_date' => $start,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $start = optional($this->event->start_date)->toDateTimeString();

        $eventTitle = $this->event->title;
        $addedByName = $this->addedBy->name;
        $location = $this->event->location;

        $mail = (new MailMessage)
            ->subject('You\'ve been added to an event: ' . $eventTitle)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($addedByName . ' has added you to the following event:')
            ->line('**Event:** ' . $eventTitle)
            ->line('**Starts:** ' . $start);

        if ($location) {
            $mail->line('**Location:** ' . $location);
        }

        return $mail
            ->action('View Event', url('/event'))
            ->line('Thank you for being part of this event!');
    }
}
