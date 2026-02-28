<?php

namespace App\Notifications\Division;

use App\Models\Division;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DivisionMemberAddedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Division $division,
        public readonly User $addedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'division_member_added',
            'level' => 'info',
            'title' => 'Added to division',
            'body' => "{$this->addedBy->name} added you to {$this->division->name}.",
            'action_url' => '/division',
            'meta' => [
                'division_id' => $this->division->id,
                'added_by' => $this->addedBy->id,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("You've been added to a division: {$this->division->name}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("{$this->addedBy->name} has added you to the following division:")
            ->line("**Division:** {$this->division->name}")
            ->action('View Division', url('/divisions'))
            ->line('You now have access to this division\'s events, projects, and to-do lists.');
    }
}
