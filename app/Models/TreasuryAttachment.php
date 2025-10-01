<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TreasuryAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'treasury_request_id',
        'filename',
        'original_filename',
        'file_path',
        'file_type',
        'file_size',
        'description',
        'uploaded_by',
    ];

    /**
     * Get the treasury request that owns the attachment.
     */
    public function treasuryRequest(): BelongsTo
    {
        return $this->belongsTo(TreasuryRequest::class);
    }

    /**
     * Get the user who uploaded the attachment.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}