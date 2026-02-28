<?php

namespace App\Notifications\TodoItem;

use App\Models\TodoItem;
use App\Models\TodoList;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TodoItemDueSoonNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TodoItem $item,
        public readonly TodoList $list,
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
        $actionUrl = $this->list->type === 'division' ? '/toDoList/division' : '/toDoList/personal';

        return [
            'kind' => 'todo_item_due_soon',
            'level' => 'warning',
            'title' => 'To-do due soon',
            'body' => '"' . $this->item->title . '" in ' . $this->list->title . ' is due ' . $dueText . '.',
            'action_url' => $actionUrl,
            'meta' => [
                'todo_list_id' => $this->list->id,
                'todo_item_id' => $this->item->id,
                'days_until_due' => $this->daysUntilDue,
                'due_date' => optional($this->item->due_date)->toDateString(),
                'todo_list_type' => $this->list->type,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $dueText = $this->daysUntilDue <= 0 ? 'today' : ($this->daysUntilDue === 1 ? 'tomorrow' : 'in ' . $this->daysUntilDue . ' days');
        $actionUrl = $this->list->type === 'division' ? url('/toDoList/division') : url('/toDoList/personal');
        $dueDate = optional($this->item->due_date)->toDateString();

        $mail = (new MailMessage)
            ->subject('To-do due soon: ' . $this->item->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('A to-do item assigned to you is due ' . $dueText . ':')
            ->line('**Item:** ' . $this->item->title)
            ->line('**List:** ' . $this->list->title);

        if ($dueDate) {
            $mail->line('**Due date:** ' . $dueDate);
        }

        return $mail
            ->action('View To-Do List', $actionUrl)
            ->line('Please make sure to complete it on time.');
    }
}
