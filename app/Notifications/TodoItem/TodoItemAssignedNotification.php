<?php

namespace App\Notifications\TodoItem;

use App\Models\TodoItem;
use App\Models\TodoList;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TodoItemAssignedNotification extends Notification implements ShouldQueue
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
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $actionUrl = $this->list->type === 'division' ? '/toDoList/division' : '/toDoList/personal';

        return [
            'kind' => 'todo_item_assigned',
            'level' => 'info',
            'title' => 'New to-do assigned',
            'body' => "{$this->assignedBy->name} assigned you to \"{$this->item->title}\" in {$this->list->title}.",
            'action_url' => $actionUrl,
            'meta' => [
                'todo_list_id' => $this->list->id,
                'todo_item_id' => $this->item->id,
                'assigned_by' => $this->assignedBy->id,
                'todo_list_type' => $this->list->type,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $actionUrl = $this->list->type === 'division' ? url('/toDoList/division') : url('/toDoList/personal');

        $mail = (new MailMessage)
            ->subject('New to-do assigned: ' . $this->item->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->assignedBy->name . ' has assigned you a new to-do item:')
            ->line('**Item:** ' . $this->item->title)
            ->line('**List:** ' . $this->list->title);

        if (!empty($this->item->due_date)) {
            $mail->line('**Due:** ' . $this->item->due_date);
        }

        return $mail
            ->action('View To-Do List', $actionUrl)
            ->line('Please complete this item before the due date.');
    }
}
