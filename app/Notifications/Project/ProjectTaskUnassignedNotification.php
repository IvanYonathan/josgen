<?php

namespace App\Notifications\Project;

use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectTaskUnassignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly ProjectTask $task,
        public readonly Project $project,
        public readonly User $changedBy,
        public readonly ?User $newAssignee,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $body = $this->newAssignee
            ? $this->changedBy->name . ' reassigned "' . $this->task->title . '" to ' . $this->newAssignee->name . ' in ' . $this->project->name . '.'
            : $this->changedBy->name . ' unassigned you from "' . $this->task->title . '" in ' . $this->project->name . '.';

        return [
            'kind' => $this->newAssignee ? 'project_task_reassigned' : 'project_task_unassigned',
            'level' => 'info',
            'title' => $this->newAssignee ? 'Task reassigned' : 'Task unassigned',
            'body' => $body,
            'action_url' => '/project',
            'meta' => [
                'project_id' => $this->project->id,
                'task_id' => $this->task->id,
                'changed_by' => $this->changedBy->id,
                'new_assigned_to' => $this->newAssignee?->id,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        if ($this->newAssignee) {
            return (new MailMessage)
                ->subject('Task reassigned: ' . $this->task->title)
                ->greeting('Hello ' . $notifiable->name . '!')
                ->line($this->changedBy->name . ' has reassigned a task to ' . $this->newAssignee->name . ':')
                ->line('**Task:** ' . $this->task->title)
                ->line('**Project:** ' . $this->project->name)
                ->action('View Project', url('/project'))
                ->line('You are no longer assigned to this task.');
        }

        return (new MailMessage)
            ->subject('Task unassigned: ' . $this->task->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->changedBy->name . ' has unassigned you from a task:')
            ->line('**Task:** ' . $this->task->title)
            ->line('**Project:** ' . $this->project->name)
            ->action('View Project', url('/project'))
            ->line('You are no longer assigned to this task.');
    }
}
