<?php

namespace App\Notifications\Event;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Event $event,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'event_completed',
            'level' => 'success',
            'title' => 'Event completed',
            'body' => "The event \"{$this->event->title}\" has been completed.",
            'action_url' => '/event',
            'meta' => [
                'event_id' => $this->event->id,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Event completed: {$this->event->title}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("The following event you participated in has been completed:")
            ->line("**Event:** {$this->event->title}")
            ->action('View Event', url('/event'))
            ->line('Thank you for your participation. We hope to see you at future events!');
    }
}
