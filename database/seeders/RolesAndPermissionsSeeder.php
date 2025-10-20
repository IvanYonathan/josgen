<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // User permissions
            'view users',
            'create users',
            'edit users',
            'delete users',

            // Division permissions
            'view divisions',
            'create divisions',
            'edit divisions',
            'delete divisions',

            // Event permissions
            'view events',
            'create events',
            'edit events',
            'delete events',

            // Project permissions
            'view projects',
            'create projects',
            'edit projects',
            'delete projects',

            // Todo permissions
            'view todo lists',
            'create todo lists',
            'edit todo lists',
            'delete todo lists',

            // Treasury permissions
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

        $admin = Role::findOrCreate('sysadmin', 'web');
        $admin->syncPermissions(Permission::all());

        $divisionLeader = Role::findOrCreate('division_leader', 'web');
        $divisionLeader->syncPermissions([
            'view divisions',
            'view events',
            'create events',
            'edit events',
            'view projects',
            'create projects',
            'edit projects',
            'view todo lists',
            'create todo lists',
            'edit todo lists',
            'create treasury requests',
            'view own treasury requests',
        ]);

        $treasurer = Role::findOrCreate('treasurer', 'web');
        $treasurer->syncPermissions([
            'view divisions',
            'view events',
            'view projects',
            'view all treasury requests',
            'approve treasury requests',
            'process payments',
            'view treasury reports'
        ]);

        $member = Role::findOrCreate('member', 'web');
        $member->syncPermissions([
            'view divisions',
            'view users',
            'view events',
            'view projects',
            'view todo lists',
            'create todo lists',
            'edit todo lists',
            'create treasury requests',
            'view own treasury requests',
        ]);
    }
}
