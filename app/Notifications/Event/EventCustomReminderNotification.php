<?php

namespace App\Notifications\Event;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventCustomReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Event $event,
        public readonly string $presetLabel,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'event_custom_reminder',
            'level' => 'warning',
            'title' => 'Event reminder',
            'body' => "Reminder: \"{$this->event->title}\" starts in {$this->presetLabel}.",
            'action_url' => '/event',
            'meta' => [
                'event_id' => $this->event->id,
                'preset_label' => $this->presetLabel,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $start = optional($this->event->start_date)->toDateTimeString();

        $mail = (new MailMessage)
            ->subject("Reminder: {$this->event->title} starts in {$this->presetLabel}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("This is a reminder that an upcoming event starts in **{$this->presetLabel}**:")
            ->line("**Event:** {$this->event->title}")
            ->line("**Starts:** {$start}");

        if ($this->event->location) {
            $mail->line("**Location:** {$this->event->location}");
        }

        return $mail
            ->action('View Event', url('/event'))
            ->line('Please make sure you are prepared for this event.');
    }
}
