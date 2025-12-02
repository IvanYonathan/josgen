<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Support\PermissionRegistry;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Clear cache to avoid stale lookups while seeding.
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $allPermissions = PermissionRegistry::allPermissionNames();
        $permissionRoleMap = PermissionRegistry::permissionRoleMap();

        $roles = $this->ensureRolesExist($this->collectRoleNames($permissionRoleMap));
        $permissions = $this->ensurePermissionsExist($allPermissions);

        foreach ($permissionRoleMap as $permissionName => $roleNames) {
            $permission = $permissions[$permissionName] ?? null;

            if (!$permission) {
                continue;
            }

            foreach ($roleNames as $roleName) {
                $role = $roles[$roleName] ?? null;

                if ($role) {
                    $role->permissions()->syncWithoutDetaching([$permission->id]);
                }
            }
        }

        // Sysadmin should always own everything.
        if (isset($roles['sysadmin'])) {
            $roles['sysadmin']->syncPermissions($permissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * @param  array<int, string>  $permissionNames
     * @return array<string, \App\Models\Permission>
     */
    private function ensurePermissionsExist(array $permissionNames): array
    {
        $created = [];

        foreach ($permissionNames as $permissionName) {
            $created[$permissionName] = Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }

        return $created;
    }

    /**
     * @param  array<string, array<int, string>>  $permissionRoleMap
     * @return array<string, bool>
     */
    private function collectRoleNames(array $permissionRoleMap): array
    {
        $roles = [];

        foreach (PermissionRegistry::DEFAULT_ROLES as $roleName) {
            $roles[$roleName] = true;
        }

        foreach ($permissionRoleMap as $roleNames) {
            foreach ($roleNames as $roleName) {
                $roles[$roleName] = true;
            }
        }

        return $roles;
    }

    /**
     * @param  array<string, bool>  $roleNames
     * @return array<string, \App\Models\Role>
     */
    private function ensureRolesExist(array $roleNames): array
    {
        $created = [];

        foreach (array_keys($roleNames) as $roleName) {
            $created[$roleName] = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);
        }

        return $created;
    }
}
