<?php

namespace App\Models;

use App\Support\TreasuryCategories;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Financial Record Model
 * Represents organization-level income and expense records managed by the Treasurer.
 * This is separate from TreasuryRequest (user-submitted reimbursements/fund requests).
 */
class FinancialRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'description',
        'amount',
        'currency',
        'record_date',
        'category',
        'reference_number',
        'treasury_request_id',
        'division_id',
        'project_id',
        'event_id',
        'created_by',
        'attachment_path',
    ];

    protected $casts = [
        'record_date' => 'date',
        'amount' => 'decimal:2',
    ];

    /**
     * Get income categories from config.
     */
    public static function incomeCategories(): array
    {
        return TreasuryCategories::incomeCategories();
    }

    /**
     * Get expense categories from config.
     */
    public static function expenseCategories(): array
    {
        return TreasuryCategories::expenseCategories();
    }

    /**
     * Get the user who created this record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the related treasury request if any.
     */
    public function treasuryRequest(): BelongsTo
    {
        return $this->belongsTo(TreasuryRequest::class);
    }

    /**
     * Get the division if associated.
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Get the project if associated.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the event if associated.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Scope to filter by income type.
     */
    public function scopeIncome($query)
    {
        return $query->where('type', 'income');
    }

    /**
     * Scope to filter by expense type.
     */
    public function scopeExpense($query)
    {
        return $query->where('type', 'expense');
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('record_date', [$startDate, $endDate]);
    }
}
