<?php

namespace App\Notifications\Treasury;

use App\Models\TreasuryRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TreasuryPaymentProcessedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly TreasuryRequest $request,
        public readonly User $processedBy,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'treasury_paid',
            'level' => 'success',
            'title' => 'Payment processed',
            'body' => 'Payment was processed for "' . $this->request->title . '" by ' . $this->processedBy->name . '.',
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

    public function toMail(object $notifiable): MailMessage
    {
        $amount = number_format($this->request->amount, 2);
        $currency = $this->request->currency ?? 'IDR';

        $mail = (new MailMessage)
            ->subject('Payment processed: ' . $this->request->title)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Payment has been processed for your treasury request:')
            ->line('**Title:** ' . $this->request->title)
            ->line('**Amount:** ' . $currency . ' ' . $amount)
            ->line('**Processed by:** ' . $this->processedBy->name);

        if ($this->request->payment_method) {
            $mail->line('**Payment method:** ' . $this->request->payment_method);
        }

        if ($this->request->payment_reference) {
            $mail->line('**Reference:** ' . $this->request->payment_reference);
        }

        return $mail
            ->action('View Treasury', url('/treasury'))
            ->line('Your request has been fulfilled.');
    }
}
