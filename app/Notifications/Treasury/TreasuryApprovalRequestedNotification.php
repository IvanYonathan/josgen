<?php

namespace App\Notifications\Treasury;

use App\Models\TreasuryRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TreasuryApprovalRequestedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TreasuryRequest $request,
        public readonly User $requester,
        public readonly string $stage, // leader|treasurer
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $stageLabel = $this->stage === 'treasurer' ? 'Treasurer' : 'Leader';

        return [
            'kind' => 'treasury_approval_requested',
            'level' => 'info',
            'title' => 'Approval requested',
            'body' => $stageLabel . ' approval requested for "' . $this->request->title . '" by ' . $this->requester->name . '.',
            'action_url' => '/treasury',
            'meta' => [
                'treasury_request_id' => $this->request->id,
                'stage' => $this->stage,
                'requested_by' => $this->requester->id,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $stageLabel = $this->stage === 'treasurer' ? 'Treasurer' : 'Leader';
        $amount = number_format($this->request->amount, 2);
        $currency = $this->request->currency ?? 'IDR';

        return (new MailMessage)
            ->subject($stageLabel . ' approval needed: ' . $this->request->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('A treasury request requires your ' . $stageLabel . ' approval:')
            ->line('**Requester:** ' . $this->requester->name)
            ->line('**Title:** ' . $this->request->title)
            ->line('**Amount:** ' . $currency . ' ' . $amount)
            ->action('Review Request', url('/treasury'))
            ->line('Please review and take action on this request.');
    }
}
