<?php

namespace App\Jobs;

use App\Models\GoogleCalendarEvent;
use App\Models\User;
use App\Services\CalendarEventFormatter;
use App\Services\GoogleCalendarService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SyncCalendarItem implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public array $backoff = [10, 30, 60];

    public function __construct(
        private int $userId,
        private string $syncableType,
        private int $syncableId,
        private string $action = 'upsert',
    ) {}

    public function handle(GoogleCalendarService $calendarService, CalendarEventFormatter $formatter): void
    {
        $user = User::find($this->userId);
        if (!$user || !$user->hasGoogleCalendarConnected()) {
            return;
        }

        if ($this->action === 'delete') {
            $this->handleDelete($user, $calendarService);
            return;
        }

        $model = $this->resolveModel();
        if (!$model) {
            return;
        }

        $eventData = $formatter->format($model);
        if (!$eventData) {
            return;
        }

        $mapping = GoogleCalendarEvent::where('user_id', $this->userId)
            ->where('syncable_type', $this->syncableType)
            ->where('syncable_id', $this->syncableId)
            ->first();

        if ($mapping) {
            $updated = $calendarService->updateEvent($user, $mapping->google_event_id, $eventData);
            if (!$updated) {
                $mapping->delete();
                $this->createNew($user, $calendarService, $eventData);
            }
        } else {
            $this->createNew($user, $calendarService, $eventData);
        }
    }

    private function handleDelete(User $user, GoogleCalendarService $calendarService): void
    {
        $mapping = GoogleCalendarEvent::where('user_id', $this->userId)
            ->where('syncable_type', $this->syncableType)
            ->where('syncable_id', $this->syncableId)
            ->first();

        if (!$mapping) {
            return;
        }

        $calendarService->deleteEvent($user, $mapping->google_event_id);
        $mapping->delete();
    }

    private function createNew(User $user, GoogleCalendarService $calendarService, array $eventData): void
    {
        $googleEventId = $calendarService->createEvent($user, $eventData);

        if ($googleEventId) {
            GoogleCalendarEvent::create([
                'user_id' => $this->userId,
                'google_event_id' => $googleEventId,
                'syncable_type' => $this->syncableType,
                'syncable_id' => $this->syncableId,
            ]);
        }
    }

    private function resolveModel(): ?Model
    {
        if (!class_exists($this->syncableType)) {
            Log::warning('SyncCalendarItem: Unknown syncable type', [
                'type' => $this->syncableType,
            ]);
            return null;
        }

        return $this->syncableType::find($this->syncableId);
    }
}
