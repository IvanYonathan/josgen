<?php

namespace Database\Seeders;

use App\Models\Division;
use Illuminate\Database\Seeder;

class DivisionsSeeder extends Seeder
{
    public function run(): void
    {
        Division::create([
            'name' => 'Worship Team',
            'description' => 'Music and worship coordination team',
            'leader_id' => null  // Set this to null initially
        ]);
    }
}