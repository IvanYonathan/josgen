<?php

namespace App\Notifications\Project;

use App\Models\Project;
use App\Models\ProjectTask;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectTaskOverdueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly ProjectTask $task,
        public readonly Project $project,
        public readonly int $daysOverdue,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $suffix = $this->daysOverdue === 1 ? 'day' : 'days';

        return [
            'kind' => 'project_task_overdue',
            'level' => 'error',
            'title' => 'Task overdue',
            'body' => '"' . $this->task->title . '" in ' . $this->project->name . ' is overdue by ' . $this->daysOverdue . ' ' . $suffix . '.',
            'action_url' => '/project',
            'meta' => [
                'project_id' => $this->project->id,
                'task_id' => $this->task->id,
                'days_overdue' => $this->daysOverdue,
                'due_date' => optional($this->task->end_date)->toDateString(),
                'overdue_on' => now()->toDateString(),
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $suffix = $this->daysOverdue === 1 ? 'day' : 'days';
        $dueDate = optional($this->task->end_date)->toDateString();

        $mail = (new MailMessage)
            ->subject('Task overdue: ' . $this->task->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('A task assigned to you is overdue by ' . $this->daysOverdue . ' ' . $suffix . ':')
            ->line('**Task:** ' . $this->task->title)
            ->line('**Project:** ' . $this->project->name);

        if ($dueDate) {
            $mail->line('**Due date:** ' . $dueDate);
        }

        return $mail
            ->action('View Project', url('/project'))
            ->line('Please complete this task as soon as possible.');
    }
}
