<?php

namespace App\Support;

class PermissionRegistry
{
    /**
     * Default core roles we want to keep in sync.
     *
     * @var array<int, string>
     */
    public const DEFAULT_ROLES = [
        'sysadmin',
    ];

    /**
     * Base permissions used throughout the platform.
     *
     * @var array<int, string>
     */
    private const BASE_PERMISSIONS = [
        // User management
        'view users',
        'create users',
        'edit users',
        'delete users',

        // Role management
        'view roles',
        'create roles',
        'edit roles',
        'delete roles',

        // Permission management
        'view permissions',
        'create permissions',
        'edit permissions',
        'delete permissions',

        // Divisions
        'view divisions',
        'create divisions',
        'edit divisions',
        'delete divisions',

        // Events
        'view events',
        'create events',
        'edit events',
        'delete events',

        // Projects
        'view projects',
        'create projects',
        'edit projects',
        'delete projects',

        // Todo lists
        'view todo lists',
        'create todo lists',
        'edit todo lists',
        'delete todo lists',

        // Notes
        'create notes',
        'edit notes',
        'delete notes',

        // Treasury
        'create treasury requests',
        'view own treasury requests',
        'view all treasury requests',
        'approve treasury requests',
        'process payments',
        'view treasury reports',
    ];

    /**
     * Role-specific permission assignments (excluding sysadmin which receives all).
     *
     * @var array<string, array<int, string>>
     */
    private const ROLE_PERMISSION_MAP = [
        'member' => [
            'create treasury requests',
            'view own treasury requests',
            'view events',
            'view projects',
            'view todo lists',
            'create todo lists',
            'edit todo lists',
            'create notes',
            'edit notes',
        ],
        'treasurer' => [
            'create treasury requests',
            'view own treasury requests',
            'view all treasury requests',
            'approve treasury requests',
            'process payments',
            'view treasury reports',
        ],
        'division_leader' => [
            'create treasury requests',
            'view own treasury requests',
            'view all treasury requests',
            'approve treasury requests',
            'view divisions',
            'edit divisions',
        ],
    ];

    /**
     * Returns the definitive map of permission => roles that should own it by default.
     *
     * @return array<string, array<int, string>>
     */
    public static function permissionRoleMap(): array
    {
        $map = [];

        foreach (self::allPermissionNames() as $permission) {
            $map[$permission] = ['sysadmin'];
        }

        foreach (self::ROLE_PERMISSION_MAP as $role => $permissions) {
            foreach ($permissions as $permission) {
                $map[$permission][] = $role;
            }
        }

        foreach ($map as $permission => $roles) {
            $map[$permission] = array_values(array_unique($roles));
        }

        return $map;
    }

    /**
     * Flattened list of all core permissions.
     *
     * @return array<int, string>
     */
    public static function allPermissionNames(): array
    {
        $roleSpecific = [];
        foreach (self::ROLE_PERMISSION_MAP as $permissions) {
            $roleSpecific = array_merge($roleSpecific, $permissions);
        }

        return array_values(array_unique(array_merge(self::BASE_PERMISSIONS, $roleSpecific)));
    }
}
