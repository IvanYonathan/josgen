<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Notifications\Event\EventStartingSoonNotification;
use Illuminate\Console\Command;

class SendEventStartingSoonReminders extends Command
{
    private const LEGACY_NOTIFICATION_TYPE = 'App\\Notifications\\EventStartingSoonNotification';

    /**
     * @var string
     */
    protected $signature = 'notifications:send-event-starting-soon {--minutes=60,15 : Comma-separated minutes until start}';

    /**
     * @var string
     */
    protected $description = 'Send reminders to event participants when an event is starting soon';

    public function handle(): int
    {
        $minutesOption = (string) $this->option('minutes');
        $minutesList = collect(explode(',', $minutesOption))
            ->map(fn ($m) => (int) trim($m))
            ->filter(fn ($m) => $m > 0 && $m <= 1440)
            ->unique()
            ->sortDesc()
            ->values();

        if ($minutesList->isEmpty()) {
            $this->warn('No valid --minutes provided.');
            return Command::SUCCESS;
        }

        $sent = 0;
        $now = now();

        foreach ($minutesList as $minutesUntilStart) {
            $windowEnd = $now->copy()->addMinutes($minutesUntilStart);
            $windowStart = $windowEnd->copy()->subMinutes(14);

            $events = Event::query()
                ->where('status', 'upcoming')
                ->whereBetween('start_date', [$windowStart, $windowEnd])
                ->with(['participants:id,name'])
                ->get();

            foreach ($events as $event) {
                foreach ($event->participants as $participant) {
                    $alreadySent = $participant
                        ->notifications()
                        ->whereIn('type', [self::LEGACY_NOTIFICATION_TYPE, EventStartingSoonNotification::class])
                        ->where('data->meta->event_id', $event->id)
                        ->where('data->meta->minutes_until_start', $minutesUntilStart)
                        ->exists();

                    if ($alreadySent) {
                        continue;
                    }

                    $participant->notify(new EventStartingSoonNotification($event, $minutesUntilStart));
                    $sent++;
                }
            }
        }

        if ($sent === 0) {
            $this->info('No event reminders to send.');
        } else {
            $this->info("✓ Sent {$sent} event reminder notification(s).");
        }

        return Command::SUCCESS;
    }
}
