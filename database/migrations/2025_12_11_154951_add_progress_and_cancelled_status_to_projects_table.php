<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Add progress field (0-100)
            $table->integer('progress')->default(0)->after('status');

            // Update status enum to include 'cancelled'
            $table->dropColumn('status');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->enum('status', ['planning', 'active', 'on_hold', 'completed', 'cancelled'])
                ->default('planning')
                ->after('end_date');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('progress');
            $table->dropColumn('status');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->enum('status', ['planning', 'active', 'completed', 'on_hold'])
                ->default('planning')
                ->after('end_date');
        });
    }
};
