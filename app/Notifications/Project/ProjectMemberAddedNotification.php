<?php

namespace App\Notifications\Project;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ProjectMemberAddedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Project $project,
        public readonly User $addedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
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
}
