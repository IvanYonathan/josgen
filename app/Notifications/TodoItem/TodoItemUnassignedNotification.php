<?php

namespace App\Notifications\TodoItem;

use App\Models\TodoItem;
use App\Models\TodoList;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TodoItemUnassignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly TodoItem $item,
        public readonly TodoList $list,
        public readonly User $changedBy,
        public readonly ?User $newAssignee,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $actionUrl = $this->list->type === 'division' ? '/toDoList/division' : '/toDoList/personal';
        $body = $this->newAssignee
            ? "{$this->changedBy->name} reassigned “{$this->item->title}” to {$this->newAssignee->name} in {$this->list->title}."
            : "{$this->changedBy->name} unassigned you from “{$this->item->title}” in {$this->list->title}.";

        return [
            'kind' => $this->newAssignee ? 'todo_item_reassigned' : 'todo_item_unassigned',
            'level' => 'info',
            'title' => $this->newAssignee ? 'To-do reassigned' : 'To-do unassigned',
            'body' => $body,
            'action_url' => $actionUrl,
            'meta' => [
                'todo_list_id' => $this->list->id,
                'todo_item_id' => $this->item->id,
                'changed_by' => $this->changedBy->id,
                'new_assigned_to' => $this->newAssignee?->id,
                'todo_list_type' => $this->list->type,
            ],
        ];
    }
}
