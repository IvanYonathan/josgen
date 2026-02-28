<?php

namespace App\Notifications\Event;

use App\Models\Event;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Event $event,
        public readonly User $createdBy,
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
            'kind' => 'event_created',
            'level' => 'info',
            'title' => 'New event created',
            'body' => $this->createdBy->name . ' created "' . $this->event->title . '" (starts ' . $start . ').',
            'action_url' => '/event',
            'meta' => [
                'event_id' => $this->event->id,
                'created_by' => $this->createdBy->id,
                'start_date' => $start,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $start = optional($this->event->start_date)->toDateTimeString();
        $location = $this->event->location;

        $mail = (new MailMessage)
            ->subject('New event: ' . $this->event->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->createdBy->name . ' has created a new event:')
            ->line('**Event:** ' . $this->event->title)
            ->line('**Starts:** ' . $start);

        if ($location) {
            $mail->line('**Location:** ' . $location);
        }

        return $mail
            ->action('View Event', url('/event'))
            ->line('Check the event details for more information.');
    }
}
