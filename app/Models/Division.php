<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Division extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'leader_id',
    ];

    /**
     * Get the leader of the division.
     */
    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    /**
     * Get the members of the division (many-to-many).
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'division_members')
            ->withTimestamps();
    }

    /**
     * Get the events associated with the division (many-to-many).
     */
    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'event_divisions')
            ->withTimestamps();
    }

    /**
     * Get the projects associated with the division (many-to-many).
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_divisions')
            ->withTimestamps();
    }

    /**
     * Get the todo lists associated with the division.
     */
    public function todoLists(): HasMany
    {
        return $this->hasMany(TodoList::class);
    }

    /**
     * Get the notes associated with the division.
     */
    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    /**
     * Get the treasury requests associated with the division.
     */
    public function treasuryRequests(): HasMany
    {
        return $this->hasMany(TreasuryRequest::class);
    }
}