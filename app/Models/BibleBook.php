<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BibleBook extends Model
{
    use HasFactory;

    protected $fillable = [
        'version_id',
        'book_number',
        'book_name',
        'testament',
    ];

    /**
     * Get the version this book belongs to.
     */
    public function version(): BelongsTo
    {
        return $this->belongsTo(BibleVersion::class);
    }

    /**
     * Get the verses for this book.
     */
    public function verses(): HasMany
    {
        return $this->hasMany(BibleVerse::class, 'book_id');
    }
}
