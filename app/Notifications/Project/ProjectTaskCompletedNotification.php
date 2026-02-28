<?php

namespace App\Notifications\Project;

use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectTaskCompletedNotification extends Notification implements ShouldQueue
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
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'project_task_completed',
            'level' => 'success',
            'title' => 'Task completed',
            'body' => $this->completedBy->name . ' marked "' . $this->task->title . '" as completed in ' . $this->project->name . '.',
            'action_url' => '/project',
            'meta' => [
                'project_id' => $this->project->id,
                'task_id' => $this->task->id,
                'completed_by' => $this->completedBy->id,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Task completed: ' . $this->task->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->completedBy->name . ' has completed a task:')
            ->line('**Task:** ' . $this->task->title)
            ->line('**Project:** ' . $this->project->name)
            ->action('View Project', url('/project'))
            ->line('Great progress on the project!');
    }
}
