<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BibleVerse extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id',
        'chapter',
        'verse_start',
        'verse_end',
        'verse_text',
        'reference',
        'url',
    ];

    /**
     * Get the book this verse belongs to.
     */
    public function book(): BelongsTo
    {
        return $this->belongsTo(BibleBook::class);
    }

    /**
     * Get the daily verse schedules for this verse.
     */
    public function dailyVerses(): HasMany
    {
        return $this->hasMany(DailyVerse::class, 'verse_id');
    }
}
