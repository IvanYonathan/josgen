<?php

namespace App\Notifications\Treasury;

use App\Models\TreasuryRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TreasuryRequestSubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TreasuryRequest $request,
        public readonly User $requester,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'treasury_submitted',
            'level' => 'info',
            'title' => 'New treasury request',
            'body' => "{$this->requester->name} submitted \"{$this->request->title}\".",
            'action_url' => '/treasury',
            'meta' => [
                'treasury_request_id' => $this->request->id,
                'requested_by' => $this->requester->id,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $amount = number_format($this->request->amount, 2);
        $currency = $this->request->currency ?? 'IDR';

        return (new MailMessage)
            ->subject('New treasury request: ' . $this->request->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('A new treasury request has been submitted and requires your review:')
            ->line('**Requester:** ' . $this->requester->name)
            ->line('**Title:** ' . $this->request->title)
            ->line('**Amount:** ' . $currency . ' ' . $amount)
            ->action('Review Request', url('/treasury'))
            ->line('Please review and take action on this request.');
    }
}
