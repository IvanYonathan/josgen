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
        Schema::create('treasury_request_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('treasury_request_id');
            $table->foreign('treasury_request_id')->references('id')->on('treasury_requests')->cascadeOnDelete();
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->string('category'); // e.g., "Transportation", "Food", "Supplies", etc.
            $table->date('item_date')->nullable(); // For reimbursements
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treasury_request_items');
    }
};