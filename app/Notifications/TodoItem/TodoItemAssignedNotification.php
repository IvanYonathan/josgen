<?php

namespace App\Notifications\TodoItem;

use App\Models\TodoItem;
use App\Models\TodoList;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TodoItemAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly TodoItem $item,
        public readonly TodoList $list,
        public readonly User $assignedBy,
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
            'kind' => 'todo_item_assigned',
            'level' => 'info',
            'title' => 'New to-do assigned',
            'body' => "{$this->assignedBy->name} assigned you to “{$this->item->title}” in {$this->list->title}.",
            'action_url' => $actionUrl,
            'meta' => [
                'todo_list_id' => $this->list->id,
                'todo_item_id' => $this->item->id,
                'assigned_by' => $this->assignedBy->id,
                'todo_list_type' => $this->list->type,
            ],
        ];
    }
}
