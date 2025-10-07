<?php

namespace App\Repositories;

use App\Models\BibleVerse;
use App\Models\DailyVerse;
use Carbon\Carbon;

class DailyVerseRepository
{
    /**
     * Get verse by scheduled date
     */
    public function getVerseByDate(string $date): ?array
    {
        $dailyVerse = DailyVerse::with('verse.book.version')
            ->whereDate('scheduled_date', $date)
            ->first();

        if (!$dailyVerse) {
            return null;
        }

        $verse = $dailyVerse->verse;

        return [
            'id' => $verse->id,
            'reference' => $verse->reference,
            'text' => $verse->verse_text,
            'url' => $verse->url,
            'book' => [
                'name' => $verse->book->book_name,
                'testament' => $verse->book->testament,
            ],
            'version' => [
                'abbreviation' => $verse->book->version->abbreviation,
                'name' => $verse->book->version->name,
                'language' => $verse->book->version->language,
            ],
            'chapter' => $verse->chapter,
            'verse_start' => $verse->verse_start,
            'verse_end' => $verse->verse_end,
            'scheduled_date' => $dailyVerse->scheduled_date->toDateString(),
        ];
    }

    /**
     * Get today's verse
     */
    public function getTodaysVerse(): ?array
    {
        return $this->getVerseByDate(Carbon::today()->toDateString());
    }

    /**
     * Get verses for a date range
     */
    public function getVersesForDateRange(string $startDate, string $endDate): array
    {
        $dailyVerses = DailyVerse::with('verse.book.version')
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->orderBy('scheduled_date')
            ->get();

        return $dailyVerses->map(function ($dailyVerse) {
            $verse = $dailyVerse->verse;
            return [
                'id' => $verse->id,
                'reference' => $verse->reference,
                'text' => $verse->verse_text,
                'url' => $verse->url,
                'scheduled_date' => $dailyVerse->scheduled_date->toDateString(),
            ];
        })->toArray();
    }

    /**
     * Check if a verse is scheduled for a specific date
     */
    public function isDateScheduled(string $date): bool
    {
        return DailyVerse::whereDate('scheduled_date', $date)->exists();
    }
}
