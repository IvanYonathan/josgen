<?php

namespace App\Notifications\TodoItem;

use App\Models\TodoItem;
use App\Models\TodoList;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TodoItemCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly TodoItem $item,
        public readonly TodoList $list,
        public readonly User $completedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $actionUrl = $this->list->type === 'division' ? '/toDoList/division' : '/toDoList/personal';

        return [
            'kind' => 'todo_item_completed',
            'level' => 'success',
            'title' => 'To-do completed',
            'body' => "{$this->completedBy->name} completed “{$this->item->title}” in {$this->list->title}.",
            'action_url' => $actionUrl,
            'meta' => [
                'todo_list_id' => $this->list->id,
                'todo_item_id' => $this->item->id,
                'completed_by' => $this->completedBy->id,
                'todo_list_type' => $this->list->type,
            ],
        ];
    }
}
