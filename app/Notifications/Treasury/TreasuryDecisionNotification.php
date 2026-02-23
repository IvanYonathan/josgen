<?php

namespace App\Notifications\Treasury;

use App\Models\TreasuryRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TreasuryDecisionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TreasuryRequest $request,
        public readonly User $decidedBy,
        public readonly string $decision, // approved|rejected
        public readonly string $level, // leader|treasurer
    ) {
    }

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if ($this->decision === 'approved') {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toDatabase(object $notifiable): array
    {
        $levelLabel = $this->level === 'treasurer' ? 'Treasurer' : 'Leader';
        $isApproved = $this->decision === 'approved';

        return [
            'kind' => $isApproved ? 'treasury_approved' : 'treasury_rejected',
            'level' => $isApproved ? 'success' : 'error',
            'title' => $isApproved ? 'Request approved' : 'Request rejected',
            'body' => "\"{$this->request->title}\" was {$this->decision} by {$this->decidedBy->name} ({$levelLabel}).",
            'action_url' => '/treasury',
            'meta' => [
                'treasury_request_id' => $this->request->id,
                'decision' => $this->decision,
                'level' => $this->level,
                'decided_by' => $this->decidedBy->id,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $levelLabel = $this->level === 'treasurer' ? 'Treasurer' : 'Leader';

        return (new MailMessage)
            ->subject('Treasury request approved: ' . $this->request->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Your treasury request has been approved!')
            ->line('**Request:** ' . $this->request->title)
            ->line('**Approved by:** ' . $this->decidedBy->name . ' (' . $levelLabel . ')')
            ->action('View Treasury', url('/treasury'))
            ->line('Please follow up with the next steps as required.');
    }
}
