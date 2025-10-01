<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TodoList extends Model
{
    use HasFactory;

    protected $table = 'todo_lists';

    protected $fillable = [
        'title',
        'type',
        'user_id',
        'division_id',
    ];

    /**
     * Get the user who owns the todo list.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the division associated with the todo list.
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Get the items in the todo list.
     */
    public function items(): HasMany
    {
        return $this->hasMany(TodoItem::class);
    }

    /**
     * Scope a query to only include personal todo lists.
     */
    public function scopePersonal($query)
    {
        return $query->where('type', 'personal');
    }

    /**
     * Scope a query to only include division todo lists.
     */
    public function scopeDivision($query)
    {
        return $query->where('type', 'division');
    }
}