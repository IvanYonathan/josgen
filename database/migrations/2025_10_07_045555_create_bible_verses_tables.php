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
        // Bible versions table
        Schema::create('bible_versions', function (Blueprint $table) {
            $table->id();
            $table->string('abbreviation', 10)->unique(); // e.g., NIV, ESV, KJV
            $table->string('name', 255); // e.g., New International Version
            $table->string('language', 10)->default('en'); // e.g., en, id
            $table->timestamps();
        });

        // Books table
        Schema::create('bible_books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('version_id')->constrained('bible_versions')->onDelete('cascade');
            $table->integer('book_number'); // 1-66
            $table->string('book_name', 100); // e.g., Genesis, John
            $table->enum('testament', ['old', 'new']);
            $table->timestamps();

            $table->index(['version_id', 'book_number']);
        });

        // Verses table
        Schema::create('bible_verses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained('bible_books')->onDelete('cascade');
            $table->integer('chapter');
            $table->integer('verse_start');
            $table->integer('verse_end')->nullable(); // For verse ranges like 8-9
            $table->text('verse_text');
            $table->string('reference', 100); // e.g., "John 3:16", "Ephesians 2:8-9"
            $table->string('url', 500)->nullable(); // Bible.com URL
            $table->timestamps();

            $table->index(['book_id', 'chapter', 'verse_start']);
            $table->index('reference');
        });

        // Daily verses table (scheduled verses)
        Schema::create('daily_verses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verse_id')->constrained('bible_verses')->onDelete('cascade');
            $table->date('scheduled_date')->unique();
            $table->timestamps();

            $table->index('scheduled_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_verses');
        Schema::dropIfExists('bible_verses');
        Schema::dropIfExists('bible_books');
        Schema::dropIfExists('bible_versions');
    }
};
