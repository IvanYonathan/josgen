<?php

namespace App\Notifications\Project;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectMemberRemovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Project $project,
        public readonly User $removedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'project_member_removed',
            'level' => 'warning',
            'title' => 'Removed from project',
            'body' => $this->removedBy->name . ' removed you from ' . $this->project->name . '.',
            'action_url' => '/project',
            'meta' => [
                'project_id' => $this->project->id,
                'removed_by' => $this->removedBy->id,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Removed from project: ' . $this->project->name)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->removedBy->name . ' has removed you from the following project:')
            ->line('**Project:** ' . $this->project->name)
            ->action('View Projects', url('/project'))
            ->line('If you believe this was a mistake, please contact the project manager.');
    }
}
