<?php

namespace App\Notifications\Project;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ProjectMemberRemovedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Project $project,
        public readonly User $removedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'project_member_removed',
            'level' => 'warning',
            'title' => 'Removed from project',
            'body' => "{$this->removedBy->name} removed you from {$this->project->name}.",
            'action_url' => '/project',
            'meta' => [
                'project_id' => $this->project->id,
                'removed_by' => $this->removedBy->id,
            ],
        ];
    }
}
