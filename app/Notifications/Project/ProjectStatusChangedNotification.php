<?php

namespace App\Notifications\Project;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ProjectStatusChangedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Project $project,
        public readonly User $changedBy,
        public readonly string $from,
        public readonly string $to,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'project_status_changed',
            'level' => 'info',
            'title' => 'Project status updated',
            'body' => "{$this->changedBy->name} changed {$this->project->name} from {$this->from} to {$this->to}.",
            'action_url' => '/project',
            'meta' => [
                'project_id' => $this->project->id,
                'changed_by' => $this->changedBy->id,
                'from' => $this->from,
                'to' => $this->to,
            ],
        ];
    }
}
