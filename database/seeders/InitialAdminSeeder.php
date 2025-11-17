<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class InitialAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = config('auth.initial_admin.email', 'admin@josgen.org');
        $password = config('auth.initial_admin.password', 'password');

        $admin = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => 'System Administrator',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
                'phone' => null,
                'role' => 'sysadmin',
                'birthday' => now(),
            ]
        );

        if (!$admin->hasRole('sysadmin')) {
            $admin->assignRole('sysadmin');
        }
    }
}
