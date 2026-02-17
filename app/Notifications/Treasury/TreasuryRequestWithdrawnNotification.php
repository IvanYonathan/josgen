<?php

namespace App\Notifications\Treasury;

use App\Models\TreasuryRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TreasuryRequestWithdrawnNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly TreasuryRequest $request,
        public readonly User $withdrawnBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'treasury_withdrawn',
            'level' => 'warning',
            'title' => 'Treasury request withdrawn',
            'body' => "{$this->withdrawnBy->name} withdrew “{$this->request->title}” ({$this->request->status}).",
            'action_url' => '/treasury',
            'meta' => [
                'treasury_request_id' => $this->request->id,
                'withdrawn_by' => $this->withdrawnBy->id,
                'status' => $this->request->status,
            ],
        ];
    }
}
