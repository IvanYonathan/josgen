<?php

use App\Jobs\PrewarmDailyVerseCache;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule daily verse cache prewarming (runs every night at 11:59 PM UTC)
Schedule::job(new PrewarmDailyVerseCache)
    ->daily()
    ->at('23:59')
    ->timezone('UTC')
    ->description('Pre-warm cache for tomorrow\'s daily verse');

// Schedule event status updates (runs every 15 minutes)
Schedule::command('events:update-statuses')
    ->everyFifteenMinutes()
    ->description('Update event statuses based on current date (upcoming → ongoing → completed)');
