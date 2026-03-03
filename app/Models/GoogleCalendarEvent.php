<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class GoogleCalendarEvent extends Model
{
    protected $fillable = [
        'user_id',
        'google_event_id',
        'syncable_type',
        'syncable_id',
        'calendar_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function syncable(): MorphTo
    {
        return $this->morphTo();
    }
}
