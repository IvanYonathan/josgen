<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TreasuryRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'description',
        'amount',
        'currency',
        'request_date',
        'needed_by_date',
        'status',
        'requested_by',
        'division_id',
        'project_id',
        'event_id',
        'approved_by',
        'approved_at',
        'approval_notes',
        'payment_method',
        'payment_reference',
        'payment_date',
        'processed_by',
    ];

    protected $casts = [
        'request_date' => 'date',
        'needed_by_date' => 'date',
        'approved_at' => 'datetime',
        'payment_date' => 'date',
        'amount' => 'decimal:2',
    ];

    /**
     * Get the user who requested the treasury item.
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Get the user who approved the treasury request.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the user who processed the payment.
     */
    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Get the division associated with the treasury request.
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Get the project associated with the treasury request.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the event associated with the treasury request.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the items associated with the treasury request.
     */
    public function items(): HasMany
    {
        return $this->hasMany(TreasuryRequestItem::class);
    }

    /**
     * Get the attachments associated with the treasury request.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(TreasuryAttachment::class);
    }

    /**
     * Scope a query to only include fund requests.
     */
    public function scopeFundRequests($query)
    {
        return $query->where('type', 'fund_request');
    }

    /**
     * Scope a query to only include reimbursements.
     */
    public function scopeReimbursements($query)
    {
        return $query->where('type', 'reimbursement');
    }

    /**
     * Scope a query to only include requests with a specific status.
     */
    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}