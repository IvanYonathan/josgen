<?php

namespace App\Notifications\Project;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Project $project,
        public readonly User $changedBy,
        public readonly string $from,
        public readonly string $to,
    ) {
    }

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if ($this->to === 'completed') {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'project_status_changed',
            'level' => 'info',
            'title' => 'Project status updated',
            'body' => "{$this->changedBy->name} changed {$this->project->name} from {$this->from} to {$this->to}.",
            'action_url' => '/project',
            'meta' => [
                'project_id' => $this->project->id,
                'changed_by' => $this->changedBy->id,
                'from' => $this->from,
                'to' => $this->to,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Project completed: {$this->project->name}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("Great news! A project you are part of has been completed.")
            ->line("**Project:** {$this->project->name}")
            ->line("**Completed by:** {$this->changedBy->name}")
            ->action('View Project', url('/project'))
            ->line('Congratulations to everyone who contributed to this project!');
    }
}
