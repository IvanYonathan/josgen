<?php

namespace App\Notifications\Treasury;

use App\Models\TreasuryRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TreasuryRequestEditedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly TreasuryRequest $request,
        public readonly User $editedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'treasury_edited',
            'level' => 'info',
            'title' => 'Treasury request updated',
            'body' => "{$this->editedBy->name} updated “{$this->request->title}”.",
            'action_url' => '/treasury',
            'meta' => [
                'treasury_request_id' => $this->request->id,
                'edited_by' => $this->editedBy->id,
                'status' => $this->request->status,
            ],
        ];
    }
}
