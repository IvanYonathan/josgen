<?php

namespace App\Notifications\Event;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventStartingSoonNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Event $event,
        public readonly int $minutesUntilStart,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $start = optional($this->event->start_date)->toDateTimeString();
        $inText = $this->minutesUntilStart === 60 ? 'in 1 hour' : 'in ' . $this->minutesUntilStart . ' minutes';

        return [
            'kind' => 'event_starting_soon',
            'level' => 'warning',
            'title' => 'Event starting soon',
            'body' => '"' . $this->event->title . '" starts ' . $inText . ' (' . $start . ').',
            'action_url' => '/event',
            'meta' => [
                'event_id' => $this->event->id,
                'minutes_until_start' => $this->minutesUntilStart,
                'start_date' => $start,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $start = optional($this->event->start_date)->toDateTimeString();
        $inText = $this->minutesUntilStart === 60 ? 'in 1 hour' : 'in ' . $this->minutesUntilStart . ' minutes';
        $location = $this->event->location;

        $mail = (new MailMessage)
            ->subject('Starting soon: ' . $this->event->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Your event is starting ' . $inText . ':')
            ->line('**Event:** ' . $this->event->title)
            ->line('**Starts:** ' . $start);

        if ($location) {
            $mail->line('**Location:** ' . $location);
        }

        return $mail
            ->action('View Event', url('/event'))
            ->line('Don\'t forget to attend!');
    }
}
