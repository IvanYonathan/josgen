<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('google_calendar_tokens', function (Blueprint $table) {
            $table->timestamp('connected_at')->nullable()->after('scopes');
        });

        DB::table('google_calendar_tokens')
            ->whereNull('connected_at')
            ->update(['connected_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        Schema::table('google_calendar_tokens', function (Blueprint $table) {
            $table->dropColumn('connected_at');
        });
    }
};
