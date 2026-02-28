<?php

namespace App\Notifications\Project;

use App\Models\Project;
use App\Models\ProjectTask;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectTaskDueSoonNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly ProjectTask $task,
        public readonly Project $project,
        public readonly int $daysUntilDue,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $dueText = $this->daysUntilDue <= 0 ? 'today' : ($this->daysUntilDue === 1 ? 'tomorrow' : 'in ' . $this->daysUntilDue . ' days');

        return [
            'kind' => 'project_task_due_soon',
            'level' => 'warning',
            'title' => 'Task due soon',
            'body' => '"' . $this->task->title . '" in ' . $this->project->name . ' is due ' . $dueText . '.',
            'action_url' => '/project',
            'meta' => [
                'project_id' => $this->project->id,
                'task_id' => $this->task->id,
                'days_until_due' => $this->daysUntilDue,
                'due_date' => optional($this->task->end_date)->toDateString(),
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $dueText = $this->daysUntilDue <= 0 ? 'today' : ($this->daysUntilDue === 1 ? 'tomorrow' : 'in ' . $this->daysUntilDue . ' days');
        $dueDate = optional($this->task->end_date)->toDateString();

        $mail = (new MailMessage)
            ->subject('Task due soon: ' . $this->task->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('A task assigned to you is due ' . $dueText . ':')
            ->line('**Task:** ' . $this->task->title)
            ->line('**Project:** ' . $this->project->name);

        if ($dueDate) {
            $mail->line('**Due date:** ' . $dueDate);
        }

        return $mail
            ->action('View Project', url('/project'))
            ->line('Please make sure to complete it on time.');
    }
}
