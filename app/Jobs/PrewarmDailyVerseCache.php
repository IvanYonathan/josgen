<?php

namespace App\Jobs;

use App\Services\DailyVerseService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class PrewarmDailyVerseCache implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(DailyVerseService $dailyVerseService): void
    {
        // Pre-warm cache for tomorrow's verse
        $dailyVerseService->prewarmTomorrowsCache();
    }
}
