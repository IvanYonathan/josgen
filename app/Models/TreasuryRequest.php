<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

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
        'attachment_filename',
        'attachment_original_name',
        'attachment_path',
        'attachment_type',
        'attachment_size',
    ];

    protected $appends = ['attachment_url'];

    protected $casts = [
        'request_date' => 'date',
        'needed_by_date' => 'date',
        'approved_at' => 'datetime',
        'payment_date' => 'date',
        'amount' => 'decimal:2',
    ];

    /**
     * Get the full URL for the attachment.
     */
    public function getAttachmentUrlAttribute(): ?string
    {
        if (!$this->attachment_path) {
            return null;
        }

        $disk = config('filesystems.disks.r2.key') ? 'r2' : 'public';

        return Storage::disk($disk)->url($this->attachment_path);
    }

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
     * Check if request has an attachment.
     */
    public function hasAttachment(): bool
    {
        return !empty($this->attachment_path);
    }

    /**
     * Get the approval records for this treasury request.
     */
    public function approvals(): HasMany
    {
        return $this->hasMany(TreasuryRequestApproval::class);
    }

    /**
     * Check if the request has been rejected.
     */
    public function isRejected(): bool
    {
        return $this->approvals()->where('decision', 'rejected')->exists();
    }

    /**
     * Check if leader has approved.
     */
    public function hasLeaderApproval(): bool
    {
        return $this->approvals()
            ->where('approval_level', 'leader')
            ->where('decision', 'approved')
            ->exists();
    }

    /**
     * Check if treasurer has approved.
     */
    public function hasTreasurerApproval(): bool
    {
        return $this->approvals()
            ->where('approval_level', 'treasurer')
            ->where('decision', 'approved')
            ->exists();
    }

    /**
     * Check if fully approved (both leader and treasurer).
     */
    public function isFullyApproved(): bool
    {
        return $this->hasLeaderApproval() && $this->hasTreasurerApproval();
    }

    /**
     * Get the current approval stage.
     * Returns: 'pending_leader', 'pending_treasurer', 'approved', 'rejected'
     */
    public function getApprovalStage(): string
    {
        if ($this->isRejected()) {
            return 'rejected';
        }

        if ($this->isFullyApproved()) {
            return 'approved';
        }

        if ($this->hasLeaderApproval()) {
            return 'pending_treasurer';
        }

        return 'pending_leader';
    }

    /**
     * Recalculate and update the status based on approvals.
     */
    public function recalculateStatus(): void
    {
        if ($this->status === 'draft') {
            return; // Don't change draft status
        }

        if ($this->isRejected()) {
            $this->status = 'rejected';
        } elseif ($this->isFullyApproved()) {
            $this->status = 'approved';
            $this->approved_at = now();
        } elseif ($this->hasLeaderApproval()) {
            $this->status = 'under_review';
        }

        $this->save();
    }

    /**
     * Get expense categories from config.
     */
    public static function expenseCategories(): array
    {
        return \App\Support\TreasuryCategories::expenseCategories();
    }

    /**
     * Predefined expense categories (deprecated, use expenseCategories() method).
     */
    public const expense_categories = [
        'transportation' => 'Transportation',
        'food' => 'Food & Beverages',
        'supplies' => 'Supplies & Materials',
        'equipment' => 'Equipment',
        'venue' => 'Venue & Rental',
        'printing' => 'Printing & Stationery',
        'communication' => 'Communication',
        'utilities' => 'Utilities',
        'maintenance' => 'Maintenance',
        'other' => 'Other',
    ];

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