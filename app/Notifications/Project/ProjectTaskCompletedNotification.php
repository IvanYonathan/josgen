<?php

namespace App\Notifications\Project;

use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ProjectTaskCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly ProjectTask $task,
        public readonly Project $project,
        public readonly User $completedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'project_task_completed',
            'level' => 'success',
            'title' => 'Task completed',
            'body' => "{$this->completedBy->name} marked “{$this->task->title}” as completed in {$this->project->name}.",
            'action_url' => '/project',
            'meta' => [
                'project_id' => $this->project->id,
                'task_id' => $this->task->id,
                'completed_by' => $this->completedBy->id,
            ],
        ];
    }
}
