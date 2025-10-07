<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BibleVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'abbreviation',
        'name',
        'language',
    ];

    /**
     * Get the books for this version.
     */
    public function books(): HasMany
    {
        return $this->hasMany(BibleBook::class, 'version_id');
    }
}
