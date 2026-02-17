<?php

namespace App\Notifications\Treasury;

use App\Models\TreasuryRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TreasuryRequestSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly TreasuryRequest $request,
        public readonly User $requester,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'treasury_submitted',
            'level' => 'info',
            'title' => 'New treasury request',
            'body' => "{$this->requester->name} submitted “{$this->request->title}”.",
            'action_url' => '/treasury',
            'meta' => [
                'treasury_request_id' => $this->request->id,
                'requested_by' => $this->requester->id,
            ],
        ];
    }
}
