<?php

namespace App\Notifications\Event;

use App\Models\Event;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventCancelledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Event $event,
        public readonly User $cancelledBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'event_cancelled',
            'level' => 'warning',
            'title' => 'Event cancelled',
            'body' => $this->cancelledBy->name . ' cancelled "' . $this->event->title . '".',
            'action_url' => '/event',
            'meta' => [
                'event_id' => $this->event->id,
                'cancelled_by' => $this->cancelledBy->id,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Event cancelled: ' . $this->event->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->cancelledBy->name . ' has cancelled the following event:')
            ->line('**Event:** ' . $this->event->title)
            ->action('View Events', url('/event'))
            ->line('If you have any questions, please contact the organizer.');
    }
}
