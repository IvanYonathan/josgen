<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        $guardName = 'web';

        // Create new permissions
        $viewOwn = Permission::firstOrCreate([
            'name' => 'view own divisions',
            'guard_name' => $guardName,
        ]);

        $viewAll = Permission::firstOrCreate([
            'name' => 'view all divisions',
            'guard_name' => $guardName,
        ]);

        // Find the old permission
        $oldPermission = Permission::where('name', 'view divisions')
            ->where('guard_name', $guardName)
            ->first();

        if ($oldPermission) {
            // Transfer: all roles that had "view divisions" get "view own divisions"
            $roles = $oldPermission->roles()->get();
            foreach ($roles as $role) {
                $role->givePermissionTo($viewOwn);
            }

            // Transfer: all users that had direct "view divisions" get "view own divisions"
            $users = $oldPermission->users()->get();
            foreach ($users as $user) {
                $user->givePermissionTo($viewOwn);
            }

            // Delete old permission (cascades pivot entries)
            $oldPermission->delete();
        }

        // Give sysadmin "view all divisions"
        $sysadmin = Role::where('name', 'sysadmin')
            ->where('guard_name', $guardName)
            ->first();

        if ($sysadmin) {
            $sysadmin->givePermissionTo($viewAll);
        }

        // Clear Spatie cache
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $guardName = 'web';

        // Recreate old permission
        $oldPermission = Permission::firstOrCreate([
            'name' => 'view divisions',
            'guard_name' => $guardName,
        ]);

        // Transfer back: roles with either new permission get the old one
        $viewOwn = Permission::where('name', 'view own divisions')
            ->where('guard_name', $guardName)
            ->first();

        $viewAll = Permission::where('name', 'view all divisions')
            ->where('guard_name', $guardName)
            ->first();

        if ($viewOwn) {
            foreach ($viewOwn->roles()->get() as $role) {
                $role->givePermissionTo($oldPermission);
            }
            foreach ($viewOwn->users()->get() as $user) {
                $user->givePermissionTo($oldPermission);
            }
            $viewOwn->delete();
        }

        if ($viewAll) {
            foreach ($viewAll->roles()->get() as $role) {
                $role->givePermissionTo($oldPermission);
            }
            foreach ($viewAll->users()->get() as $user) {
                $user->givePermissionTo($oldPermission);
            }
            $viewAll->delete();
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
