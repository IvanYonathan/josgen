<?php

namespace App\Notifications\Treasury;

use App\Models\TreasuryRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TreasuryApprovalRequestedNotification extends Notification
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
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $stageLabel = $this->stage === 'treasurer' ? 'Treasurer' : 'Leader';

        return [
            'kind' => 'treasury_approval_requested',
            'level' => 'info',
            'title' => 'Approval requested',
            'body' => "{$stageLabel} approval requested for “{$this->request->title}” by {$this->requester->name}.",
            'action_url' => '/treasury',
            'meta' => [
                'treasury_request_id' => $this->request->id,
                'stage' => $this->stage,
                'requested_by' => $this->requester->id,
            ],
        ];
    }
}
