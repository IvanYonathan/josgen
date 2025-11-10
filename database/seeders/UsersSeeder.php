<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@josgen.org',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'phone' => '081234567890',
            'role' => 'Sysadmin',
            'birthday' => now(),
        ]);
        $adminUser->assignRole('sysadmin');

        // Create treasurer
        $treasurerUser = User::create([
            'name' => 'Treasurer',
            'email' => 'treasurer@josgen.org',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'phone' => '081234567891',
            'role' => 'Treasurer',
            'birthday' => now(),
        ]);
        $treasurerUser->assignRole('treasurer');

        // Create a division leader
        $leaderUser = User::create([
            'name' => 'Division Leader',
            'email' => 'leader@josgen.org',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'phone' => '081234567892',
            'role' => 'Division_Leader',
            'birthday' => now(),
        ]);
        $leaderUser->assignRole('division_leader');

        // Create a regular member
        $memberUser = User::create([
            'name' => 'Regular Member',
            'email' => 'member@josgen.org',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'phone' => '081234567893',
            'role' => 'Member',
            'birthday' => now(),
        ]);
        $memberUser->assignRole('member');
    }
}
