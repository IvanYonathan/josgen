<?php

namespace App\Notifications\Treasury;

use App\Models\TreasuryRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TreasuryPaymentProcessedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly TreasuryRequest $request,
        public readonly User $processedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'treasury_paid',
            'level' => 'success',
            'title' => 'Payment processed',
            'body' => "Payment was processed for “{$this->request->title}” by {$this->processedBy->name}.",
            'action_url' => '/treasury',
            'meta' => [
                'treasury_request_id' => $this->request->id,
                'processed_by' => $this->processedBy->id,
                'payment_date' => optional($this->request->payment_date)->toDateString(),
                'payment_method' => $this->request->payment_method,
                'payment_reference' => $this->request->payment_reference,
            ],
        ];
    }
}
