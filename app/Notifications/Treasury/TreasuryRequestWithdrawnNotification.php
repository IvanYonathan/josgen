<?php

namespace App\Notifications\Treasury;

use App\Models\TreasuryRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TreasuryRequestWithdrawnNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TreasuryRequest $request,
        public readonly User $withdrawnBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'treasury_withdrawn',
            'level' => 'warning',
            'title' => 'Treasury request withdrawn',
            'body' => $this->withdrawnBy->name . ' withdrew "' . $this->request->title . '" (' . $this->request->status . ').',
            'action_url' => '/treasury',
            'meta' => [
                'treasury_request_id' => $this->request->id,
                'withdrawn_by' => $this->withdrawnBy->id,
                'status' => $this->request->status,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Treasury request withdrawn: ' . $this->request->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->withdrawnBy->name . ' has withdrawn a treasury request:')
            ->line('**Title:** ' . $this->request->title)
            ->line('**Previous status:** ' . $this->request->status)
            ->action('View Treasury', url('/treasury'))
            ->line('This request is no longer active.');
    }
}
