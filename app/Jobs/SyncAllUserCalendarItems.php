<?php

namespace App\Jobs;

use App\Models\Event;
use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\TodoItem;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncAllUserCalendarItems implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;
    public int $timeout = 300;

    public function __construct(
        private int $userId,
    ) {}

    public function handle(): void
    {
        $user = User::find($this->userId);
        if (!$user || !$user->hasGoogleCalendarConnected()) {
            return;
        }

        $this->syncEvents($user);
        $this->syncProjects($user);
        $this->syncTodoItems($user);
        $this->syncProjectTasks($user);
    }

    private function syncEvents(User $user): void
    {
        $eventIds = collect();

        $eventIds = $eventIds->merge(
            $user->participatingEvents()->pluck('events.id')
        );

        $eventIds = $eventIds->merge(
            $user->organizedEvents()->pluck('id')
        );

        $eventIds->unique()->each(function ($eventId) use ($user) {
            SyncCalendarItem::dispatch(
                $user->id,
                Event::class,
                $eventId,
                'upsert'
            );
        });
    }

    private function syncProjects(User $user): void
    {
        $projectIds = collect();

        $projectIds = $projectIds->merge(
            $user->memberProjects()->pluck('projects.id')
        );

        $projectIds = $projectIds->merge(
            $user->managedProjects()->pluck('id')
        );

        $projectIds->unique()->each(function ($projectId) use ($user) {
            SyncCalendarItem::dispatch(
                $user->id,
                Project::class,
                $projectId,
                'upsert'
            );
        });
    }

    private function syncTodoItems(User $user): void
    {
        $todoItemIds = collect();

        // Items explicitly assigned to the user
        $todoItemIds = $todoItemIds->merge(
            $user->assignedTodoItems()
                ->whereNotNull('due_date')
                ->pluck('id')
        );

        // Items in user's own lists where assigned_to is null (personal items)
        $todoItemIds = $todoItemIds->merge(
            TodoItem::whereHas('todoList', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
                ->whereNull('assigned_to')
                ->whereNotNull('due_date')
                ->pluck('id')
        );

        $todoItemIds->unique()->each(function ($itemId) use ($user) {
            SyncCalendarItem::dispatch(
                $user->id,
                TodoItem::class,
                $itemId,
                'upsert'
            );
        });
    }

    private function syncProjectTasks(User $user): void
    {
        ProjectTask::where('assigned_to', $user->id)
            ->pluck('id')
            ->each(function ($taskId) use ($user) {
                SyncCalendarItem::dispatch(
                    $user->id,
                    ProjectTask::class,
                    $taskId,
                    'upsert'
                );
            });
    }
}
