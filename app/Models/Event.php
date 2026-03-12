<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
        'location',
        'status',
        'organizer_id',
        'division_id', // Kept for backward compatibility, but will use divisions() relationship
        'reminder_presets',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'reminder_presets' => 'array',
    ];

    /**
     * Get the organizer of the event.
     */
    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    /**
     * Get the division the event belongs to.
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Get the divisions the event is assigned to (many-to-many).
     */
    public function divisions(): BelongsToMany
    {
        return $this->belongsToMany(Division::class, 'event_divisions')
            ->withTimestamps();
    }

    /**
     * Get the participants of the event.
     */
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'event_participants')
            ->withTimestamps();
    }

    /**
     * Get the treasury requests associated with the event.
     */
    public function treasuryRequests(): HasMany
    {
        return $this->hasMany(TreasuryRequest::class);
    }

    /**
     * Get the reminders for this event.
     */
    public function reminders(): HasMany
    {
        return $this->hasMany(EventReminder::class);
    }

    /**
     * Sync reminder rows based on the given preset keys.
     * Deletes existing unsent reminders and creates new ones.
     */
    public function syncReminders(array $presets): void
    {
        // Delete unsent reminders so we can recreate them
        $this->reminders()->where('sent', false)->delete();

        if (empty($presets) || !$this->start_date) {
            return;
        }

        $offsets = [
            '1_day'   => fn ($date) => $date->copy()->subDay(),
            '7_days'  => fn ($date) => $date->copy()->subDays(7),
            '1_month' => fn ($date) => $date->copy()->subMonth(),
        ];

        foreach ($presets as $preset) {
            if (!isset($offsets[$preset])) {
                continue;
            }

            $remindAt = $offsets[$preset]($this->start_date);

            // Only create if remind_at is in the future
            if ($remindAt->isFuture()) {
                $this->reminders()->create([
                    'preset'    => $preset,
                    'remind_at' => $remindAt,
                    'sent'      => false,
                ]);
            }
        }
    }

    /**
     * Check if user can edit this event (must be Division Leader).
     */
    public function canBeEditedBy(User $user): bool
    {
        // Sysadmin can edit any event
        if ($user->hasRole('sysadmin')) {
            return true;
        }

        // Check if user is the organizer
        if ($this->organizer_id === $user->id) {
            return true;
        }

        // Check if user is a Division Leader
        if (!$user->hasRole('Division Leader')) {
            return false;
        }

        // Check if user is Division Leader of any assigned division
        $eventDivisionIds = $this->divisions->pluck('id')->toArray();
        return in_array($user->division_id, $eventDivisionIds);
    }

    /**
     * Check if participants can be modified (only when status is 'upcoming').
     */
    public function canModifyParticipants(): bool
    {
        return $this->status === 'upcoming';
    }

    /**
     * Update status based on current date.
     */
    public function updateStatusBasedOnDate(): void
    {
        $now = now();

        if ($this->status === 'cancelled') {
            // Don't auto-update cancelled events
            return;
        }

        if ($now < $this->start_date) {
            $this->status = 'upcoming';
        } elseif ($now >= $this->start_date && $now <= $this->end_date) {
            $this->status = 'ongoing';
        } else {
            $this->status = 'completed';
        }

        $this->save();
    }

    /**
     * Scope: Filter events by user's divisions.
     */
    public function scopeForUser($query, User $user)
    {
        return $query->whereHas('divisions', function ($q) use ($user) {
            $q->where('divisions.id', $user->division_id);
        });
    }

    /**
     * Scope: Filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by date range.
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('start_date', [$startDate, $endDate]);
    }
}