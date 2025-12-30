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
        Schema::create('treasury_request_approvals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('treasury_request_id');
            $table->foreign('treasury_request_id')->references('id')->on('treasury_requests')->cascadeOnDelete();
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->enum('decision', ['approved', 'rejected']);
            $table->enum('approval_level', ['leader', 'treasurer']); // Sequential approval: leader first, then treasurer
            $table->text('notes')->nullable();
            $table->timestamps();

            // Each user can only approve once per request
            $table->unique(['treasury_request_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treasury_request_approvals');
    }
};
