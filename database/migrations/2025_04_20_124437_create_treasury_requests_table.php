<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('treasury_requests', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['fund_request', 'reimbursement']);
            $table->string('title');
            $table->text('description');
            $table->decimal('amount', 10, 2);
            $table->string('currency')->default('IDR'); // Assuming Indonesian Rupiah as default
            $table->date('request_date');
            $table->date('needed_by_date')->nullable(); // For fund requests
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid'])->default('draft');
            
            // Requester information
            $table->unsignedBigInteger('requested_by');
            $table->foreign('requested_by')->references('id')->on('users')->cascadeOnDelete();
            
            // Related entities
            $table->unsignedBigInteger('division_id')->nullable();
            $table->foreign('division_id')->references('id')->on('divisions')->nullOnDelete();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->foreign('project_id')->references('id')->on('projects')->nullOnDelete();
            $table->unsignedBigInteger('event_id')->nullable();
            $table->foreign('event_id')->references('id')->on('events')->nullOnDelete();
            
            // Approval information
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            
            // Payment information
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->date('payment_date')->nullable();
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->foreign('processed_by')->references('id')->on('users')->nullOnDelete();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treasury_requests');
    }
};