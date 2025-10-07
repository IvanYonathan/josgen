<?php

namespace App\Services;

use App\Repositories\DailyVerseRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class DailyVerseService
{
    protected DailyVerseRepository $repository;

    public function __construct(DailyVerseRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get today's verse with caching (24-hour TTL)
     */
    public function getTodaysVerse(): ?array
    {
        $date = Carbon::today()->toDateString();
        $cacheKey = "daily_verse_{$date}";

        return Cache::remember($cacheKey, 86400, function () use ($date) {
            return $this->repository->getVerseByDate($date);
        });
    }

    /**
     * Get verse by specific date with caching
     */
    public function getVerseByDate(string $date): ?array
    {
        $cacheKey = "daily_verse_{$date}";

        return Cache::remember($cacheKey, 86400, function () use ($date) {
            return $this->repository->getVerseByDate($date);
        });
    }

    /**
     * Pre-warm cache for tomorrow's verse (called by scheduled job)
     */
    public function prewarmTomorrowsCache(): void
    {
        $tomorrow = Carbon::tomorrow()->toDateString();
        $cacheKey = "daily_verse_{$tomorrow}";

        // Pre-fetch and cache tomorrow's verse
        $verse = $this->repository->getVerseByDate($tomorrow);

        if ($verse) {
            Cache::put($cacheKey, $verse, 86400);
        }
    }

    /**
     * Clear cache for a specific date
     */
    public function clearCache(string $date): void
    {
        Cache::forget("daily_verse_{$date}");
    }

    /**
     * Clear today's cache
     */
    public function clearTodaysCache(): void
    {
        $this->clearCache(Carbon::today()->toDateString());
    }

    /**
     * Get verses for upcoming days with caching
     */
    public function getUpcomingVerses(int $days = 7): array
    {
        $startDate = Carbon::today()->toDateString();
        $endDate = Carbon::today()->addDays($days)->toDateString();

        $cacheKey = "daily_verses_{$startDate}_{$endDate}";

        return Cache::remember($cacheKey, 3600, function () use ($startDate, $endDate) {
            return $this->repository->getVersesForDateRange($startDate, $endDate);
        });
    }
}
