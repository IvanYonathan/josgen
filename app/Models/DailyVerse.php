<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyVerse extends Model
{
    use HasFactory;

    protected $fillable = [
        'verse_id',
        'scheduled_date',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
    ];

    /**
     * Get the verse for this daily verse.
     */
    public function verse(): BelongsTo
    {
        return $this->belongsTo(BibleVerse::class);
    }
}
