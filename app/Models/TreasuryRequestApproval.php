<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TreasuryRequestApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'treasury_request_id',
        'user_id',
        'decision',
        'approval_level',
        'notes',
    ];

    /**
     * Get the treasury request that this approval belongs to.
     */
    public function treasuryRequest(): BelongsTo
    {
        return $this->belongsTo(TreasuryRequest::class);
    }

    /**
     * Get the user who made this approval decision.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Scope to get only leader-level approvals.
     */
    public function scopeLeaderLevel($query)
    {
        return $query->where('approval_level', 'leader');
    }

    /**
     * Scope to get only treasurer-level approvals.
     */
    public function scopeTreasurerLevel($query)
    {
        return $query->where('approval_level', 'treasurer');
    }
}
