<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
            $table->dropColumn(['is_private', 'division_id']);
            $table->json('tags')->nullable()->after('content');
            $table->string('category')->nullable()->after('tags');
            $table->boolean('is_pinned')->default(false)->after('category');
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn(['tags', 'category', 'is_pinned']);
            $table->unsignedBigInteger('division_id')->nullable();
            $table->foreign('division_id')->references('id')->on('divisions')->nullOnDelete();
            $table->boolean('is_private')->default(true);
        });
    }
};
