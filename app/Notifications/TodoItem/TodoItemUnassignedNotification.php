<?php

namespace App\Notifications\TodoItem;

use App\Models\TodoItem;
use App\Models\TodoList;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TodoItemUnassignedNotification extends Notification implements ShouldQueue
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
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $actionUrl = $this->list->type === 'division' ? '/toDoList/division' : '/toDoList/personal';
        $body = $this->newAssignee
            ? $this->changedBy->name . ' reassigned "' . $this->item->title . '" to ' . $this->newAssignee->name . ' in ' . $this->list->title . '.'
            : $this->changedBy->name . ' unassigned you from "' . $this->item->title . '" in ' . $this->list->title . '.';

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

    public function toMail(object $notifiable): MailMessage
    {
        $actionUrl = $this->list->type === 'division' ? url('/toDoList/division') : url('/toDoList/personal');

        if ($this->newAssignee) {
            return (new MailMessage)
                ->subject('To-do reassigned: ' . $this->item->title)
                ->greeting('Hello ' . $notifiable->name . '!')
                ->line($this->changedBy->name . ' has reassigned a to-do item to ' . $this->newAssignee->name . ':')
                ->line('**Item:** ' . $this->item->title)
                ->line('**List:** ' . $this->list->title)
                ->action('View To-Do List', $actionUrl)
                ->line('You are no longer assigned to this item.');
        }

        return (new MailMessage)
            ->subject('To-do unassigned: ' . $this->item->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->changedBy->name . ' has unassigned you from a to-do item:')
            ->line('**Item:** ' . $this->item->title)
            ->line('**List:** ' . $this->list->title)
            ->action('View To-Do List', $actionUrl)
            ->line('You are no longer assigned to this item.');
    }
}
