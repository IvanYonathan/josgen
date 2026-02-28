<?php

namespace App\Notifications\Project;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectMemberAddedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Project $project,
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
            'kind' => 'project_member_added',
            'level' => 'info',
            'title' => 'Added to project',
            'body' => "{$this->addedBy->name} added you to {$this->project->name}.",
            'action_url' => '/project',
            'meta' => [
                'project_id' => $this->project->id,
                'added_by' => $this->addedBy->id,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("You've been added to a project: {$this->project->name}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("{$this->addedBy->name} has added you to the following project:")
            ->line("**Project:** {$this->project->name}")
            ->action('View Project', url('/project'))
            ->line('You can now collaborate on tasks and milestones within this project.');
    }
}
