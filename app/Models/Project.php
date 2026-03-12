<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'start_date',
        'end_date',
        'status',
        'progress',
        'manager_id',
        'division_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * Get the manager of the project.
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Get the division the project belongs to (single, backward compatibility).
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Get the divisions the project is assigned to (many-to-many).
     */
    public function divisions(): BelongsToMany
    {
        return $this->belongsToMany(Division::class, 'project_divisions')
            ->withTimestamps();
    }

    /**
     * Get the members of the project.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withTimestamps();
    }

    /**
     * Get the tasks of the project.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class);
    }

    /**
     * Get the treasury requests associated with the project.
     */
    public function treasuryRequests(): HasMany
    {
        return $this->hasMany(TreasuryRequest::class);
    }

    /**
     * Check if user can edit this project.
     * Returns true if user is the manager OR a Division Leader of an assigned division.
     */
    public function canBeEditedBy(User $user): bool
    {
        // Sysadmin can edit any project
        if ($user->hasRole('sysadmin')) {
            return true;
        }

        // Check if user is the manager
        if ($this->manager_id === $user->id) {
            return true;
        }

        // Check if user is a Division Leader
        if (!$user->hasRole('Division Leader')) {
            return false;
        }

        // Check if user is Division Leader of any assigned division
        $projectDivisionIds = $this->divisions->pluck('id')->toArray();
        return in_array($user->division_id, $projectDivisionIds);
    }

    /**
     * Check if members can be modified.
     * Returns true when status is 'planning' or 'active'.
     */
    public function canModifyMembers(): bool
    {
        return in_array($this->status, ['planning', 'active']);
    }

    /**
     * Calculate and update project progress based on completed tasks.
     * Progress = (completed tasks / total tasks) * 100
     */
    public function calculateProgress(): void
    {
        $totalTasks = $this->tasks()->count();

        if ($totalTasks === 0) {
            $this->progress = 0;
        } else {
            $completedTasks = $this->tasks()->where('is_completed', true)->count();
            $this->progress = (int) round(($completedTasks / $totalTasks) * 100);
        }

        $this->save();
    }

    /**
     * Scope: Filter projects by user's divisions or where user is manager or member.
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('manager_id', $user->id) // User is manager
                ->orWhereHas('divisions', function ($subQ) use ($user) {
                    $subQ->where('divisions.id', $user->division_id); // User's division is assigned
                })
                ->orWhereHas('members', function ($subQ) use ($user) {
                    $subQ->where('users.id', $user->id); // User is a member
                });
        });
    }

    /**
     * Scope: Filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}