<?php

namespace App\Http\Controllers\Api;

use App\Jobs\SyncAllUserCalendarItems;
use App\Services\GoogleCalendarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class GoogleCalendarController extends ApiController
{
    public function __construct(
        private GoogleCalendarService $googleCalendarService
    ) {}

    public function connect(): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return $this->unauthorized();
        }

        if (!config('services.google.client_id') || !config('services.google.client_secret')) {
            return $this->error('Google Calendar integration is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.', null, 500);
        }

        $authUrl = $this->googleCalendarService->getAuthUrl($user->id);

        return $this->success(['auth_url' => $authUrl], 'Authorization URL generated');
    }

    public function callback(Request $request): RedirectResponse
    {
        $frontendUrl = config('app.url', 'http://localhost:5174');

        if ($request->has('error')) {
            return redirect($frontendUrl . '/settings/google-calendar?error=' . urlencode($request->error));
        }

        $state = $request->query('state');
        $code = $request->query('code');

        if (!$state || !$code) {
            return redirect($frontendUrl . '/settings/google-calendar?error=missing_params');
        }

        try {
            $user = $this->googleCalendarService->handleCallback($state, $code);

            SyncAllUserCalendarItems::dispatch($user->id);

            return redirect($frontendUrl . '/settings/google-calendar?success=true');
        } catch (\Exception $e) {
            Log::error('Google Calendar OAuth callback failed', [
                'error' => $e->getMessage(),
            ]);
            return redirect($frontendUrl . '/settings/google-calendar?error=' . urlencode('auth_failed'));
        }
    }

    public function disconnect(): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return $this->unauthorized();
        }

        $this->googleCalendarService->disconnect($user);

        return $this->success(null, 'Google Calendar disconnected successfully');
    }

    public function status(): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return $this->unauthorized();
        }

        $token = $user->googleCalendarToken;

        if (!$token) {
            return $this->success([
                'connected' => false,
                'google_email' => null,
                'connected_at' => null,
                'synced_events_count' => 0,
            ], 'Google Calendar status');
        }

        return $this->success([
            'connected' => true,
            'google_email' => $token->google_email,
            'connected_at' => ($token->connected_at ?? $token->created_at)->toIso8601String(),
            'synced_events_count' => $user->googleCalendarEvents()->count(),
        ], 'Google Calendar status');
    }
}
