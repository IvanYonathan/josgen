<?php

namespace App\Console\Commands;

use App\Models\EventReminder;
use App\Notifications\Event\EventCustomReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendEventCustomReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:send-event-custom-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send custom event reminder notifications set by organizers';

    /**
     * Preset display labels.
     */
    protected array $presetLabels = [
        '1_day'   => '1 day',
        '7_days'  => '7 days',
        '1_month' => '1 month',
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Sending custom event reminders...');

        $dueReminders = EventReminder::where('sent', false)
            ->where('remind_at', '<=', now())
            ->with(['event.participants:id,name,email'])
            ->get();

        if ($dueReminders->isEmpty()) {
            $this->info('No reminders due at this time.');
            return Command::SUCCESS;
        }

        $sentCount = 0;

        foreach ($dueReminders as $reminder) {
            $event = $reminder->event;

            // Mark as sent first to avoid duplicate sends on failure
            $reminder->sent = true;
            $reminder->save();

            // Skip cancelled events
            if (!$event || $event->status === 'cancelled') {
                $this->line("  • Skipped reminder #{$reminder->id} (event cancelled or missing)");
                continue;
            }

            $participants = $event->participants;

            if ($participants->isEmpty()) {
                $this->line("  • Skipped reminder #{$reminder->id} (no participants)");
                continue;
            }

            $presetLabel = $this->presetLabels[$reminder->preset] ?? $reminder->preset;

            Notification::send($participants, new EventCustomReminderNotification($event, $presetLabel));

            $sentCount++;
            $this->line("  • Sent reminder for '{$event->title}' ({$presetLabel} before) to {$participants->count()} participant(s)");
        }

        $this->info("✓ Sent {$sentCount} reminder(s) successfully.");

        return Command::SUCCESS;
    }
}
