<?php

namespace App\Notifications\Event;

use App\Models\Event;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Event $event,
        public readonly User $updatedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'event_updated',
            'level' => 'info',
            'title' => 'Event updated',
            'body' => $this->updatedBy->name . ' updated "' . $this->event->title . '".',
            'action_url' => '/event',
            'meta' => [
                'event_id' => $this->event->id,
                'updated_by' => $this->updatedBy->id,
                'start_date' => optional($this->event->start_date)->toDateTimeString(),
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $start = optional($this->event->start_date)->toDateTimeString();

        $mail = (new MailMessage)
            ->subject('Event updated: ' . $this->event->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->updatedBy->name . ' has updated the following event:')
            ->line('**Event:** ' . $this->event->title);

        if ($start) {
            $mail->line('**Starts:** ' . $start);
        }

        return $mail
            ->action('View Event', url('/event'))
            ->line('Please review the updated event details.');
    }
}
