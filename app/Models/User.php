<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'division_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the division that the user belongs to.
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Get the divisions that the user leads.
     */
    public function leadsDivisions(): HasMany
    {
        return $this->hasMany(Division::class, 'leader_id');
    }

    /**
     * Get the events organized by the user.
     */
    public function organizedEvents(): HasMany
    {
        return $this->hasMany(Event::class, 'organizer_id');
    }

    /**
     * Get the events that the user is participating in.
     */
    public function participatingEvents(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'event_participants')
            ->withPivot('attendance_status')
            ->withTimestamps();
    }

    /**
     * Get the projects managed by the user.
     */
    public function managedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'manager_id');
    }

    /**
     * Get the projects that the user is a member of.
     */
    public function memberProjects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get the todo lists owned by the user.
     */
    public function todoLists(): HasMany
    {
        return $this->hasMany(TodoList::class);
    }

    /**
     * Get the todo items assigned to the user.
     */
    public function assignedTodoItems(): HasMany
    {
        return $this->hasMany(TodoItem::class, 'assigned_to');
    }

    /**
     * Get the notes created by the user.
     */
    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    /**
     * Get the treasury requests made by the user.
     */
    public function treasuryRequests(): HasMany
    {
        return $this->hasMany(TreasuryRequest::class, 'requested_by');
    }

    /**
     * Get the treasury requests approved by the user.
     */
    public function approvedTreasuryRequests(): HasMany
    {
        return $this->hasMany(TreasuryRequest::class, 'approved_by');
    }

    /**
     * Get the treasury requests processed by the user.
     */
    public function processedTreasuryRequests(): HasMany
    {
        return $this->hasMany(TreasuryRequest::class, 'processed_by');
    }

    /**
     * Get the treasury attachments uploaded by the user.
     */
    public function treasuryAttachments(): HasMany
    {
        return $this->hasMany(TreasuryAttachment::class, 'uploaded_by');
    }
}