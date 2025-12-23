<?php

namespace Database\Seeders;

use App\Models\BibleBook;
use App\Models\BibleVerse;
use App\Models\BibleVersion;
use App\Models\DailyVerse;
use Illuminate\Database\Seeder;

class DailyVerseSeeder extends Seeder
{
    public function run(): void
    {
        // Create default Bible version
        $version = BibleVersion::firstOrCreate(
            ['abbreviation' => 'NIV'],
            ['name' => 'New International Version', 'language' => 'en']
        );

        // Find CSV file - supports dynamic filenames
        $csvPath = $this->findVerseCSV();

        if (!$csvPath) {
            $this->command->error('CSV file not found. Expected pattern: "*VOTD*.csv" in project root');
            return;
        }

        $this->command->info("Found CSV: " . basename($csvPath));

        $file = fopen($csvPath, 'r');

        // Skip BOM if present
        $bom = fread($file, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($file);
        }

        // Skip header
        fgetcsv($file);

        $count = 0;
        while (($row = fgetcsv($file)) !== false) {
            if (count($row) < 4) continue;

            [$date, $reference, $url, $text] = $row;

            // Parse reference
            preg_match('/^([\d\s]*[A-Za-z\s]+)\s+([\d:]+(?:-[\d:]+)?)$/', trim($reference), $matches);

            if (count($matches) < 3) continue;

            $bookName = trim($matches[1]);
            $verseRef = $matches[2];

            // Parse chapter:verse
            $chapter = 1;
            $verseStart = 1;
            $verseEnd = null;

            if (str_contains($verseRef, '-')) {
                [$start, $end] = explode('-', $verseRef);
                if (str_contains($start, ':')) {
                    [$chapter, $verseStart] = explode(':', $start);
                    $verseEnd = (int)$end;
                }
            } elseif (str_contains($verseRef, ':')) {
                [$chapter, $verseStart] = explode(':', $verseRef);
            }

            // Determine testament
            $oldTestamentBooks = ['Psalm', 'Psalms', 'Proverbs', 'Isaiah', 'Jeremiah', 'Ezekiel', 'Daniel', 'Judges'];
            $testament = in_array($bookName, $oldTestamentBooks) ? 'old' : 'new';

            // Create book
            $book = BibleBook::firstOrCreate(
                ['version_id' => $version->id, 'book_name' => $bookName],
                ['book_number' => 1, 'testament' => $testament]
            );

            // Create verse
            $verse = BibleVerse::firstOrCreate(
                ['book_id' => $book->id, 'reference' => trim($reference)],
                [
                    'chapter' => (int)$chapter,
                    'verse_start' => (int)$verseStart,
                    'verse_end' => $verseEnd,
                    'verse_text' => trim($text),
                    'url' => trim($url),
                ]
            );

            // Schedule daily verse
            DailyVerse::firstOrCreate(
                ['scheduled_date' => $date],
                ['verse_id' => $verse->id]
            );

            $count++;
        }

        fclose($file);
        $this->command->info("Seeded {$count} daily verses!");
    }

    /**
     * Find the verse CSV file (supports dynamic filenames)
     */
    private function findVerseCSV(): ?string
    {
        $basePath = base_path();

        // Pattern: Any CSV with "VOTD" (Verse of the Day) in the name
        $pattern = $basePath . '/*VOTD*.csv';
        $files = glob($pattern);

        if (empty($files)) {
            return null;
        }

        // Return the first matching file (or most recent if multiple)
        return $files[0];
    }
}
