<?php

namespace App\Support;

use App\Models\Permission;
use App\Models\Role;

class PermissionSynchronizer
{
    private static bool $synced = false;

    public static function sync(): void
    {
        if (self::$synced) {
            return;
        }

        $roleCache = [];
        foreach (PermissionRegistry::DEFAULT_ROLES as $roleName) {
            $roleCache[$roleName] = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);
        }

        $map = PermissionRegistry::permissionRoleMap();

        foreach ($map as $permissionName => $roles) {
            $permission = Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);

            foreach ($roles as $roleName) {
                $roleCache[$roleName] = $roleCache[$roleName] ?? Role::firstOrCreate([
                    'name' => $roleName,
                    'guard_name' => 'web',
                ]);

                $role = $roleCache[$roleName];

                if (!$role->hasPermissionTo($permissionName)) {
                    $role->givePermissionTo($permission);
                }
            }
        }

        self::$synced = true;
    }
}
