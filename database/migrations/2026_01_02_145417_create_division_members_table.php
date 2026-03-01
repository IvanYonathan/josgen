<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('division_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('division_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            // Ensure unique division-user pairs
            $table->unique(['division_id', 'user_id']);
        });

        // Migrate existing data from users.division_id to division_members
        $now = now()->toDateTimeString();
        DB::statement("
            INSERT INTO division_members (division_id, user_id, created_at, updated_at)
            SELECT division_id, id, ?, ?
            FROM users
            WHERE division_id IS NOT NULL
        ", [$now, $now]);
    }

    public function down(): void
    {
        Schema::dropIfExists('division_members');
    }
};
