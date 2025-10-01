<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TreasuryRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'treasury_request_id',
        'description',
        'amount',
        'category',
        'item_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'item_date' => 'date',
    ];

    /**
     * Get the treasury request that owns the item.
     */
    public function treasuryRequest(): BelongsTo
    {
        return $this->belongsTo(TreasuryRequest::class);
    }
}