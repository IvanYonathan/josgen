<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        // Division permissions
        $permissions = [
            'view divisions',
            'create divisions',
            'edit divisions',
            'delete divisions',
            'view events',
            'create events',
            'edit events',
            'delete events',
            'view projects',
            'create projects',
            'edit projects',
            'delete projects',
            'view todo lists',
            'create todo lists',
            'edit todo lists',
            'delete todo lists',
            'create treasury requests',
            'view own treasury requests',
            'view all treasury requests',
            'approve treasury requests',
            'process payments',
            'view treasury reports',
        ];
        
    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

        // Create roles and assign permissions
        $admin = Role::create(['name' => 'admin']);
        $admin->givePermissionTo(Permission::all());

        $divisionLeader = Role::create(['name' => 'division_leader']);
        $divisionLeader->givePermissionTo([
            'view divisions',
            'view events', 'create events', 'edit events',
            'view projects', 'create projects', 'edit projects',
            'view todo lists', 'create todo lists', 'edit todo lists',
            'create treasury requests', 'view own treasury requests',
        ]);
        
        $treasurer = Role::create(['name' => 'treasurer']);
        $treasurer->givePermissionTo([
            'view divisions',
            'view events',
            'view projects',
            'view all treasury requests',
            'approve treasury requests',
            'process payments',
            'view treasury reports'
        ]);
        
        $member = Role::create(['name' => 'member']);
        $member->givePermissionTo([
            'view divisions',
            'view events',
            'view projects',
            'view todo lists', 'create todo lists', 'edit todo lists',
            'create treasury requests', 'view own treasury requests',
        ]);
    }
}