<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Financial records for organization income/expenses tracked by the Treasurer.
     */
    public function up(): void
    {
        Schema::create('financial_records', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['income', 'expense'])->comment('income or expense');
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('IDR');
            $table->date('record_date');
            $table->string('category', 100)->nullable();
            $table->string('reference_number', 100)->nullable()->comment('Receipt/invoice number');
            
            // Source linking (optional - can link to approved treasury requests)
            $table->foreignId('treasury_request_id')->nullable()->constrained('treasury_requests')->nullOnDelete();
            
            // Division/Project/Event association (optional)
            $table->foreignId('division_id')->nullable()->constrained('divisions')->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('events')->nullOnDelete();
            
            // Who created this record
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            
            // Attachment reference (optional)
            $table->string('attachment_path')->nullable();
            
            $table->timestamps();
            
            // Indexes for common queries
            $table->index('type');
            $table->index('record_date');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_records');
    }
};
