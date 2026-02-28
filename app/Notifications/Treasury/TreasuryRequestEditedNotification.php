<?php

namespace App\Notifications\Treasury;

use App\Models\TreasuryRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TreasuryRequestEditedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TreasuryRequest $request,
        public readonly User $editedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'treasury_edited',
            'level' => 'info',
            'title' => 'Treasury request updated',
            'body' => $this->editedBy->name . ' updated "' . $this->request->title . '".',
            'action_url' => '/treasury',
            'meta' => [
                'treasury_request_id' => $this->request->id,
                'edited_by' => $this->editedBy->id,
                'status' => $this->request->status,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Treasury request updated: ' . $this->request->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->editedBy->name . ' has updated a treasury request:')
            ->line('**Title:** ' . $this->request->title)
            ->line('**Status:** ' . $this->request->status)
            ->action('View Treasury', url('/treasury'))
            ->line('Please review the updated request details.');
    }
}
