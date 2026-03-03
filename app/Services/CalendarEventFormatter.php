<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\TodoItem;
use Illuminate\Database\Eloquent\Model;

class CalendarEventFormatter
{
    public function format(Model $model): ?array
    {
        return match (true) {
            $model instanceof Event => $this->formatEvent($model),
            $model instanceof Project => $this->formatProject($model),
            $model instanceof TodoItem => $this->formatTodoItem($model),
            $model instanceof ProjectTask => $this->formatProjectTask($model),
            default => null,
        };
    }

    private function formatEvent(Event $event): array
    {
        $summary = '[Event] ' . $event->title;
        if ($event->status === 'completed') {
            $summary = '(Done) ' . $summary;
        }

        $data = [
            'summary' => $summary,
            'description' => $this->buildEventDescription($event),
            'start' => [
                'dateTime' => $event->start_date->toRfc3339String(),
                'timeZone' => config('app.timezone', 'UTC'),
            ],
            'end' => [
                'dateTime' => $event->end_date->toRfc3339String(),
                'timeZone' => config('app.timezone', 'UTC'),
            ],
        ];

        if ($event->status === 'cancelled') {
            $data['status'] = 'cancelled';
        }

        return $data;
    }

    private function formatProject(Project $project): array
    {
        $summary = '[Project] ' . $project->name;
        if ($project->status === 'completed') {
            $summary = '(Done) ' . $summary;
        }

        $data = [
            'summary' => $summary,
            'description' => $this->buildProjectDescription($project),
            'start' => [
                'date' => $project->start_date->format('Y-m-d'),
            ],
            'end' => [
                'date' => $project->end_date
                    ? $project->end_date->copy()->addDay()->format('Y-m-d')
                    : $project->start_date->copy()->addDay()->format('Y-m-d'),
            ],
        ];

        if ($project->status === 'cancelled') {
            $data['status'] = 'cancelled';
        }

        return $data;
    }

    private function formatTodoItem(TodoItem $item): array
    {
        $summary = '[Todo] ' . $item->title;
        if ($item->completed) {
            $summary = '(Done) ' . $summary;
        }

        $dueDate = $item->due_date ? $item->due_date->format('Y-m-d') : now()->format('Y-m-d');

        return [
            'summary' => $summary,
            'description' => $this->buildTodoDescription($item),
            'start' => [
                'date' => $dueDate,
            ],
            'end' => [
                'date' => $item->due_date
                    ? $item->due_date->copy()->addDay()->format('Y-m-d')
                    : now()->addDay()->format('Y-m-d'),
            ],
        ];
    }

    private function formatProjectTask(ProjectTask $task): array
    {
        $summary = '[Task] ' . $task->title;
        if ($task->is_completed) {
            $summary = '(Done) ' . $summary;
        }

        $startDate = $task->start_date ? $task->start_date->format('Y-m-d') : now()->format('Y-m-d');

        return [
            'summary' => $summary,
            'description' => $this->buildTaskDescription($task),
            'start' => [
                'date' => $startDate,
            ],
            'end' => [
                'date' => $task->end_date
                    ? $task->end_date->copy()->addDay()->format('Y-m-d')
                    : ($task->start_date
                        ? $task->start_date->copy()->addDay()->format('Y-m-d')
                        : now()->addDay()->format('Y-m-d')),
            ],
        ];
    }

    private function buildEventDescription(Event $event): string
    {
        $parts = [];
        if ($event->description) {
            $parts[] = $event->description;
        }
        $parts[] = 'Status: ' . ucfirst($event->status);
        if ($event->location) {
            $parts[] = 'Location: ' . $event->location;
        }
        $parts[] = 'Source: JosGen';

        return implode("\n", $parts);
    }

    private function buildProjectDescription(Project $project): string
    {
        $parts = [];
        if ($project->description) {
            $parts[] = $project->description;
        }
        $parts[] = 'Status: ' . ucfirst(str_replace('_', ' ', $project->status));
        $parts[] = 'Progress: ' . $project->progress . '%';
        $parts[] = 'Source: JosGen';

        return implode("\n", $parts);
    }

    private function buildTodoDescription(TodoItem $item): string
    {
        $parts = [];
        if ($item->description) {
            $parts[] = $item->description;
        }
        $parts[] = 'Priority: ' . ucfirst($item->priority ?? 'medium');
        $parts[] = 'Status: ' . ($item->completed ? 'Completed' : 'Pending');
        $item->loadMissing('todoList');
        if ($item->todoList) {
            $parts[] = 'List: ' . $item->todoList->title;
        }
        $parts[] = 'Source: JosGen';

        return implode("\n", $parts);
    }

    private function buildTaskDescription(ProjectTask $task): string
    {
        $parts = [];
        if ($task->description) {
            $parts[] = $task->description;
        }
        $task->loadMissing('project');
        if ($task->project) {
            $parts[] = 'Project: ' . $task->project->name;
        }
        $parts[] = 'Status: ' . ($task->is_completed ? 'Completed' : 'In Progress');
        $parts[] = 'Source: JosGen';

        return implode("\n", $parts);
    }
}
