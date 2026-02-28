<?php

namespace App\Console\Commands;

use App\Models\ProjectTask;
use App\Models\TodoItem;
use App\Notifications\Project\ProjectTaskDueSoonNotification;
use App\Notifications\Project\ProjectTaskOverdueNotification;
use App\Notifications\TodoItem\TodoItemDueSoonNotification;
use App\Notifications\TodoItem\TodoItemOverdueNotification;
use Illuminate\Console\Command;

class SendDueSoonReminders extends Command
{
    private const LEGACY_PROJECT_TASK_DUE_SOON_TYPE = 'App\\Notifications\\ProjectTaskDueSoonNotification';
    private const LEGACY_PROJECT_TASK_OVERDUE_TYPE = 'App\\Notifications\\ProjectTaskOverdueNotification';
    private const LEGACY_TODO_ITEM_DUE_SOON_TYPE = 'App\\Notifications\\TodoItemDueSoonNotification';
    private const LEGACY_TODO_ITEM_OVERDUE_TYPE = 'App\\Notifications\\TodoItemOverdueNotification';

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:send-due-soon-reminders {--days=3,1 : Comma-separated days until due}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send reminders for tasks/todos that are nearing their due date';

    public function handle(): int
    {
        $daysOption = (string) $this->option('days');
        $daysList = collect(explode(',', $daysOption))
            ->map(fn ($d) => (int) trim($d))
            ->filter(fn ($d) => $d >= 0 && $d <= 365)
            ->unique()
            ->sort()
            ->values();

        if ($daysList->isEmpty()) {
            $this->warn('No valid --days provided.');
            return Command::SUCCESS;
        }

        $this->info('Sending due-soon reminders for: ' . $daysList->implode(', ') . ' day(s) before due date.');

        $sentCount = 0;

        foreach ($daysList as $daysUntilDue) {
            $targetDate = now()->startOfDay()->addDays($daysUntilDue)->toDateString();

            $projectTasks = ProjectTask::query()
                ->whereNotNull('assigned_to')
                ->where('is_completed', false)
                ->whereNotNull('end_date')
                ->whereDate('end_date', $targetDate)
                ->with(['project:id,name', 'assignedUser:id,name'])
                ->get();

            foreach ($projectTasks as $task) {
                if (!$task->assignedUser || !$task->project) {
                    continue;
                }

                $alreadySent = $task->assignedUser
                    ->notifications()
                    ->whereIn('type', [self::LEGACY_PROJECT_TASK_DUE_SOON_TYPE, ProjectTaskDueSoonNotification::class])
                    ->where('data->meta->task_id', $task->id)
                    ->where('data->meta->days_until_due', $daysUntilDue)
                    ->exists();

                if ($alreadySent) {
                    continue;
                }

                $task->assignedUser->notify(new ProjectTaskDueSoonNotification($task, $task->project, $daysUntilDue));
                $sentCount++;
            }

            $todoItems = TodoItem::query()
                ->whereNotNull('assigned_to')
                ->where('completed', false)
                ->whereNotNull('due_date')
                ->whereDate('due_date', $targetDate)
                ->with(['todoList:id,title', 'assignedTo:id,name'])
                ->get();

            foreach ($todoItems as $item) {
                if (!$item->assignedTo || !$item->todoList) {
                    continue;
                }

                $alreadySent = $item->assignedTo
                    ->notifications()
                    ->whereIn('type', [self::LEGACY_TODO_ITEM_DUE_SOON_TYPE, TodoItemDueSoonNotification::class])
                    ->where('data->meta->todo_item_id', $item->id)
                    ->where('data->meta->days_until_due', $daysUntilDue)
                    ->exists();

                if ($alreadySent) {
                    continue;
                }

                $item->assignedTo->notify(new TodoItemDueSoonNotification($item, $item->todoList, $daysUntilDue));
                $sentCount++;
            }
        }

        $today = now()->startOfDay();

        $overdueProjectTasks = ProjectTask::query()
            ->whereNotNull('assigned_to')
            ->where('is_completed', false)
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', $today->toDateString())
            ->with(['project:id,name', 'assignedUser:id,name'])
            ->get();

        foreach ($overdueProjectTasks as $task) {
            if (!$task->assignedUser || !$task->project || !$task->end_date) {
                continue;
            }

            $daysOverdue = max(1, $today->diffInDays($task->end_date));

            $alreadySent = $task->assignedUser
                ->notifications()
                ->whereIn('type', [self::LEGACY_PROJECT_TASK_OVERDUE_TYPE, ProjectTaskOverdueNotification::class])
                ->where('data->meta->task_id', $task->id)
                ->where('data->meta->overdue_on', $today->toDateString())
                ->exists();

            if ($alreadySent) {
                continue;
            }

            $task->assignedUser->notify(new ProjectTaskOverdueNotification($task, $task->project, $daysOverdue));
            $sentCount++;
        }

        $overdueTodoItems = TodoItem::query()
            ->whereNotNull('assigned_to')
            ->where('completed', false)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today->toDateString())
            ->with(['todoList:id,title,type', 'assignedTo:id,name'])
            ->get();

        foreach ($overdueTodoItems as $item) {
            if (!$item->assignedTo || !$item->todoList || !$item->due_date) {
                continue;
            }

            $daysOverdue = max(1, $today->diffInDays($item->due_date));

            $alreadySent = $item->assignedTo
                ->notifications()
                ->whereIn('type', [self::LEGACY_TODO_ITEM_OVERDUE_TYPE, TodoItemOverdueNotification::class])
                ->where('data->meta->todo_item_id', $item->id)
                ->where('data->meta->overdue_on', $today->toDateString())
                ->exists();

            if ($alreadySent) {
                continue;
            }

            $item->assignedTo->notify(new TodoItemOverdueNotification($item, $item->todoList, $daysOverdue));
            $sentCount++;
        }

        if ($sentCount === 0) {
            $this->info('No reminders to send.');
        } else {
            $this->info("✓ Sent {$sentCount} reminder notification(s).");
        }

        return Command::SUCCESS;
    }
}
