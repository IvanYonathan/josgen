<?php

namespace App\Notifications\TodoItem;

use App\Models\TodoItem;
use App\Models\TodoList;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TodoItemDueSoonNotification extends Notification
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
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $dueText = $this->daysUntilDue <= 0 ? 'today' : ($this->daysUntilDue === 1 ? 'tomorrow' : "in {$this->daysUntilDue} days");
        $actionUrl = $this->list->type === 'division' ? '/toDoList/division' : '/toDoList/personal';

        return [
            'kind' => 'todo_item_due_soon',
            'level' => 'warning',
            'title' => 'To-do due soon',
            'body' => "“{$this->item->title}” in {$this->list->title} is due {$dueText}.",
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
}
