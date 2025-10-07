<?php

namespace App\Console\Commands;

use App\Models\BibleVerse;
use App\Models\DailyVerse;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class UpdateDailyVerses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'verses:update {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update daily verses from CSV file (cleans old verses and imports new ones)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('📖 Daily Verse Update Process');
        $this->newLine();

        // Step 1: Check CSV exists
        $csvPath = $this->findVerseCSV();
        if (!$csvPath) {
            $this->error('❌ CSV file not found. Expected pattern: "*VOTD*.csv" in project root');
            return Command::FAILURE;
        }

        $this->info('✅ CSV file found: ' . basename($csvPath));

        // Step 2: Count old verses
        $oldCount = DailyVerse::whereDate('scheduled_date', '<', now())->count();
        $this->info("📊 Found {$oldCount} old verses to clean up");

        // Step 3: Confirmation
        if (!$this->option('force')) {
            if (!$this->confirm('This will delete old verses and import new ones. Continue?', true)) {
                $this->warn('⚠️  Operation cancelled');
                return Command::CANCELLED;
            }
        }

        // Step 4: Delete old verses
        $this->info('🗑️  Deleting old verses...');
        $deletedVerses = DailyVerse::whereDate('scheduled_date', '<', now())->delete();

        // Also delete orphaned Bible verses (verses not scheduled anymore)
        $orphanedVerses = BibleVerse::doesntHave('dailyVerses')->delete();

        $this->info("✅ Deleted {$deletedVerses} old daily verses and {$orphanedVerses} orphaned verses");

        // Step 5: Import new verses
        $this->info('📥 Importing new verses from CSV...');
        Artisan::call('db:seed', [
            '--class' => 'DailyVerseSeeder',
            '--force' => true
        ], $this->output);

        // Step 6: Clear cache
        $this->info('🧹 Clearing verse cache...');
        Cache::flush(); // Clear all cache (or be more specific if needed)

        $this->info('✅ Cache cleared');

        // Step 7: Summary
        $totalVerses = DailyVerse::count();
        $this->newLine();
        $this->info("✨ Update complete!");
        $this->info("📊 Total verses in database: {$totalVerses}");

        // Show next 5 upcoming verses
        $upcoming = DailyVerse::with('verse')
            ->whereDate('scheduled_date', '>=', now())
            ->orderBy('scheduled_date')
            ->limit(5)
            ->get();

        if ($upcoming->count() > 0) {
            $this->newLine();
            $this->info('📅 Next 5 upcoming verses:');
            foreach ($upcoming as $dv) {
                $this->line("   {$dv->scheduled_date->format('Y-m-d')} - {$dv->verse->reference}");
            }
        }

        return Command::SUCCESS;
    }

    /**
     * Find the verse CSV file (supports dynamic filenames)
     */
    private function findVerseCSV(): ?string
    {
        $basePath = base_path();

        // Pattern: Any CSV with "VOTD" in the name
        $pattern = $basePath . '/*VOTD*.csv';
        $files = glob($pattern);

        if (empty($files)) {
            return null;
        }

        // Return the first matching file
        return $files[0];
    }
}
