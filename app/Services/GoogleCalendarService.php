<?php

namespace App\Services;

use App\Models\GoogleCalendarEvent;
use App\Models\GoogleCalendarToken;
use App\Models\User;
use Google\Client as GoogleClient;
use Google\Service\Calendar as GoogleCalendarServiceApi;
use Google\Service\Calendar\Event as GoogleEvent;
use Google\Service\Oauth2 as GoogleOauth2;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GoogleCalendarService
{
    private const SCOPES = [
        'https://www.googleapis.com/auth/calendar.events',
        'openid',
        'email',
    ];

    private function createClient(): GoogleClient
    {
        $client = new GoogleClient();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setRedirectUri(config('services.google.redirect_uri'));
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        $client->setScopes(self::SCOPES);

        return $client;
    }

    public function getAuthUrl(int $userId): string
    {
        $client = $this->createClient();

        $nonce = Str::random(32);
        $state = Crypt::encryptString(json_encode([
            'user_id' => $userId,
            'nonce' => $nonce,
            'timestamp' => now()->timestamp,
        ]));

        Cache::put('google_oauth_state:' . $nonce, $userId, now()->addMinutes(5));

        $client->setState($state);

        return $client->createAuthUrl();
    }

    public function handleCallback(string $state, string $code): User
    {
        $payload = json_decode(Crypt::decryptString($state), true);

        $userId = $payload['user_id'] ?? null;
        $nonce = $payload['nonce'] ?? null;
        $timestamp = $payload['timestamp'] ?? 0;

        if (!$userId || !$nonce) {
            throw new \InvalidArgumentException('Invalid OAuth state');
        }

        if (now()->timestamp - $timestamp > 300) {
            throw new \InvalidArgumentException('OAuth state expired');
        }

        $cachedUserId = Cache::pull('google_oauth_state:' . $nonce);
        if ($cachedUserId !== $userId) {
            throw new \InvalidArgumentException('OAuth state mismatch');
        }

        $user = User::findOrFail($userId);

        $client = $this->createClient();
        $tokenData = $client->fetchAccessTokenWithAuthCode($code);

        if (isset($tokenData['error'])) {
            throw new \RuntimeException('Failed to exchange code: ' . ($tokenData['error_description'] ?? $tokenData['error']));
        }

        $client->setAccessToken($tokenData);

        $googleEmail = null;
        try {
            $oauth2 = new GoogleOauth2($client);
            $userInfo = $oauth2->userinfo->get();
            $googleEmail = $userInfo->getEmail();
        } catch (\Exception $e) {
            Log::warning('Failed to fetch Google email', ['error' => $e->getMessage()]);
        }

        GoogleCalendarToken::updateOrCreate(
            ['user_id' => $user->id],
            [
                'access_token' => $tokenData['access_token'],
                'refresh_token' => $tokenData['refresh_token'] ?? '',
                'expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
                'google_email' => $googleEmail,
                'scopes' => implode(' ', self::SCOPES),
                'connected_at' => now(),
            ]
        );

        return $user;
    }

    public function getCalendarService(User $user): ?GoogleCalendarServiceApi
    {
        $token = $user->googleCalendarToken;

        if (!$token) {
            return null;
        }

        $client = $this->createClient();
        $client->setAccessToken([
            'access_token' => $token->access_token,
            'refresh_token' => $token->refresh_token,
            'expires_in' => max(0, now()->diffInSeconds($token->expires_at, false)),
            'created' => $token->updated_at->timestamp,
        ]);

        if ($client->isAccessTokenExpired()) {
            try {
                $newToken = $client->fetchAccessTokenWithRefreshToken($token->refresh_token);

                if (isset($newToken['error'])) {
                    Log::warning('Google token refresh failed', [
                        'user_id' => $user->id,
                        'error' => $newToken['error'],
                    ]);
                    $token->delete();
                    return null;
                }

                $token->update([
                    'access_token' => $newToken['access_token'],
                    'expires_at' => now()->addSeconds($newToken['expires_in'] ?? 3600),
                    'refresh_token' => $newToken['refresh_token'] ?? $token->refresh_token,
                ]);
            } catch (\Exception $e) {
                Log::warning('Google token refresh exception', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                $token->delete();
                return null;
            }
        }

        return new GoogleCalendarServiceApi($client);
    }

    public function createEvent(User $user, array $eventData): ?string
    {
        $service = $this->getCalendarService($user);
        if (!$service) {
            return null;
        }

        try {
            $googleEvent = new GoogleEvent($eventData);
            $result = $service->events->insert('primary', $googleEvent);
            return $result->getId();
        } catch (\Exception $e) {
            Log::error('Google Calendar create event failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function updateEvent(User $user, string $googleEventId, array $eventData): bool
    {
        $service = $this->getCalendarService($user);
        if (!$service) {
            return false;
        }

        try {
            $googleEvent = new GoogleEvent($eventData);
            $service->events->update('primary', $googleEventId, $googleEvent);
            return true;
        } catch (\Google\Service\Exception $e) {
            if ($e->getCode() === 404) {
                GoogleCalendarEvent::where('user_id', $user->id)
                    ->where('google_event_id', $googleEventId)
                    ->delete();
            }
            Log::error('Google Calendar update event failed', [
                'user_id' => $user->id,
                'google_event_id' => $googleEventId,
                'error' => $e->getMessage(),
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error('Google Calendar update event failed', [
                'user_id' => $user->id,
                'google_event_id' => $googleEventId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function deleteEvent(User $user, string $googleEventId): bool
    {
        $service = $this->getCalendarService($user);
        if (!$service) {
            return false;
        }

        try {
            $service->events->delete('primary', $googleEventId);
            return true;
        } catch (\Google\Service\Exception $e) {
            if ($e->getCode() === 404 || $e->getCode() === 410) {
                return true;
            }
            Log::error('Google Calendar delete event failed', [
                'user_id' => $user->id,
                'google_event_id' => $googleEventId,
                'error' => $e->getMessage(),
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error('Google Calendar delete event failed', [
                'user_id' => $user->id,
                'google_event_id' => $googleEventId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function disconnect(User $user): void
    {
        $token = $user->googleCalendarToken;
        if (!$token) {
            return;
        }

        $service = $this->getCalendarService($user);
        if ($service) {
            $mappings = $user->googleCalendarEvents()->get();
            foreach ($mappings as $mapping) {
                try {
                    $service->events->delete($mapping->calendar_id, $mapping->google_event_id);
                } catch (\Exception $e) {
                    Log::warning('Failed to delete Google Calendar event on disconnect', [
                        'user_id' => $user->id,
                        'google_event_id' => $mapping->google_event_id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            try {
                $client = $this->createClient();
                $client->setAccessToken(['access_token' => $token->access_token]);
                $client->revokeToken();
            } catch (\Exception $e) {
                Log::warning('Failed to revoke Google token', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $user->googleCalendarEvents()->delete();
        $token->delete();
    }
}
