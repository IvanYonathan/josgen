<?php

namespace App\Notifications\TodoItem;

use App\Models\TodoItem;
use App\Models\TodoList;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TodoItemCompletedNotification extends Notification implements ShouldQueue
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
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $actionUrl = $this->list->type === 'division' ? '/toDoList/division' : '/toDoList/personal';

        return [
            'kind' => 'todo_item_completed',
            'level' => 'success',
            'title' => 'To-do completed',
            'body' => $this->completedBy->name . ' completed "' . $this->item->title . '" in ' . $this->list->title . '.',
            'action_url' => $actionUrl,
            'meta' => [
                'todo_list_id' => $this->list->id,
                'todo_item_id' => $this->item->id,
                'completed_by' => $this->completedBy->id,
                'todo_list_type' => $this->list->type,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $actionUrl = $this->list->type === 'division' ? url('/toDoList/division') : url('/toDoList/personal');

        return (new MailMessage)
            ->subject('To-do completed: ' . $this->item->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->completedBy->name . ' has completed a to-do item:')
            ->line('**Item:** ' . $this->item->title)
            ->line('**List:** ' . $this->list->title)
            ->action('View To-Do List', $actionUrl)
            ->line('Nice work on getting things done!');
    }
}
