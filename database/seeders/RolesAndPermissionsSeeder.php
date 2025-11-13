<?php

namespace Database\Seeders;

use App\Support\PermissionSynchronizer;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        PermissionSynchronizer::sync();
    }
}
