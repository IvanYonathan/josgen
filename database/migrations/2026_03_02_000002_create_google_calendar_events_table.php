<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_calendar_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('google_event_id');
            $table->string('syncable_type');
            $table->unsignedBigInteger('syncable_id');
            $table->string('calendar_id')->default('primary');
            $table->timestamps();

            $table->unique(['user_id', 'syncable_type', 'syncable_id'], 'gcal_user_syncable_unique');
            $table->index(['syncable_type', 'syncable_id'], 'gcal_syncable_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_calendar_events');
    }
};
