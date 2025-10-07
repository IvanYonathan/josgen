<?php

namespace App\Http\Controllers\Api;

use App\Services\DailyVerseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DailyVerseController extends ApiController
{
    protected DailyVerseService $dailyVerseService;

    public function __construct(DailyVerseService $dailyVerseService)
    {
        $this->dailyVerseService = $dailyVerseService;
    }

    /**
     * Get today's verse
     */
    public function index(): JsonResponse
    {
        $verse = $this->dailyVerseService->getTodaysVerse();

        if (!$verse) {
            return $this->error('No verse scheduled for today', 404);
        }

        return $this->success($verse, 'Daily verse retrieved successfully')
            ->header('Cache-Control', 'public, max-age=86400');
    }

    /**
     * Get verse by specific date
     */
    public function getByDate(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date|date_format:Y-m-d',
        ]);

        $verse = $this->dailyVerseService->getVerseByDate($request->date);

        if (!$verse) {
            return $this->error('No verse scheduled for this date', 404);
        }

        return $this->success($verse, 'Verse retrieved successfully')
            ->header('Cache-Control', 'public, max-age=86400');
    }

    /**
     * Get upcoming verses
     */
    public function upcoming(Request $request): JsonResponse
    {
        $days = $request->input('days', 7);

        if ($days > 30) {
            $days = 30; // Limit to 30 days
        }

        $verses = $this->dailyVerseService->getUpcomingVerses($days);

        return $this->success([
            'verses' => $verses,
            'count' => count($verses),
        ], 'Upcoming verses retrieved successfully')
            ->header('Cache-Control', 'public, max-age=3600');
    }
}
