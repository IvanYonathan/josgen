<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewUserCredentialsMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly string $plainPassword,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to JosGen - Your Account Credentials',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.new-user-credentials',
            with: [
                'user' => $this->user,
                'plainPassword' => $this->plainPassword,
                'loginUrl' => url('/login'),
            ],
        );
    }
}
