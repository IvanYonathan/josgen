<?php

namespace App\Notifications\Project;

use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ProjectTaskAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly ProjectTask $task,
        public readonly Project $project,
        public readonly User $assignedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'project_task_assigned',
            'level' => 'info',
            'title' => 'New task assigned',
            'body' => "{$this->assignedBy->name} assigned you to “{$this->task->title}” in {$this->project->name}.",
            'action_url' => '/project',
            'meta' => [
                'project_id' => $this->project->id,
                'task_id' => $this->task->id,
                'assigned_by' => $this->assignedBy->id,
            ],
        ];
    }
}
