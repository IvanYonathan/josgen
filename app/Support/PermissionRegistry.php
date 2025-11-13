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
        'division_leader',
        'treasurer',
        'member',
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
        'askjdnasndasoidnasoidnasoidn',

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
        'division_leader' => [
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
        ],
        'treasurer' => [
            'view divisions',
            'view events',
            'view projects',
            'view all treasury requests',
            'approve treasury requests',
            'process payments',
            'view treasury reports',
        ],
        'member' => [
            'view divisions',
            'view users',
            'view events',
            'view projects',
            'view todo lists',
            'create todo lists',
            'edit todo lists',
            'create treasury requests',
            'view own treasury requests',
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
