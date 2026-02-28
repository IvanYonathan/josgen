<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Notifications\Event\EventCompletedNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class UpdateEventStatuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'events:update-statuses';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update event statuses based on current date (upcoming -> ongoing -> completed)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Updating event statuses...');

        $now = now();
        $updatedCount = 0;

        // Update upcoming events to ongoing (if start_date has passed)
        $upcomingToOngoing = Event::where('status', 'upcoming')
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->get();

        foreach ($upcomingToOngoing as $event) {
            $event->status = 'ongoing';
            $event->save();
            $updatedCount++;
            $this->line("  • Event #{$event->id} '{$event->title}' → ongoing");
        }

        // Update ongoing events to completed (if end_date has passed)
        $ongoingToCompleted = Event::where('status', 'ongoing')
            ->where('end_date', '<', $now)
            ->get();

        foreach ($ongoingToCompleted as $event) {
            $event->status = 'completed';
            $event->save();
            $updatedCount++;
            $this->line("  • Event #{$event->id} '{$event->title}' → completed");

            $event->load('participants:id,name,email');
            if ($event->participants->isNotEmpty()) {
                Notification::send($event->participants, new EventCompletedNotification($event));
            }
        }

        if ($updatedCount === 0) {
            $this->info('No events needed status updates.');
        } else {
            $this->info("✓ Updated {$updatedCount} event(s) successfully.");
        }

        return Command::SUCCESS;
    }
}
