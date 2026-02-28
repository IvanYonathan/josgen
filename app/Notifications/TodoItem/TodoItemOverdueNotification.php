<?php

namespace App\Notifications\TodoItem;

use App\Models\TodoItem;
use App\Models\TodoList;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TodoItemOverdueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TodoItem $item,
        public readonly TodoList $list,
        public readonly int $daysOverdue,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $actionUrl = $this->list->type === 'division' ? '/toDoList/division' : '/toDoList/personal';
        $suffix = $this->daysOverdue === 1 ? 'day' : 'days';

        return [
            'kind' => 'todo_item_overdue',
            'level' => 'error',
            'title' => 'To-do overdue',
            'body' => '"' . $this->item->title . '" in ' . $this->list->title . ' is overdue by ' . $this->daysOverdue . ' ' . $suffix . '.',
            'action_url' => $actionUrl,
            'meta' => [
                'todo_list_id' => $this->list->id,
                'todo_item_id' => $this->item->id,
                'days_overdue' => $this->daysOverdue,
                'due_date' => optional($this->item->due_date)->toDateString(),
                'overdue_on' => now()->toDateString(),
                'todo_list_type' => $this->list->type,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $suffix = $this->daysOverdue === 1 ? 'day' : 'days';
        $actionUrl = $this->list->type === 'division' ? url('/toDoList/division') : url('/toDoList/personal');
        $dueDate = optional($this->item->due_date)->toDateString();

        $mail = (new MailMessage)
            ->subject('To-do overdue: ' . $this->item->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('A to-do item assigned to you is overdue by ' . $this->daysOverdue . ' ' . $suffix . ':')
            ->line('**Item:** ' . $this->item->title)
            ->line('**List:** ' . $this->list->title);

        if ($dueDate) {
            $mail->line('**Due date:** ' . $dueDate);
        }

        return $mail
            ->action('View To-Do List', $actionUrl)
            ->line('Please complete this item as soon as possible.');
    }
}
