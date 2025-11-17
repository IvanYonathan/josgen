<?php

namespace App\Http\Controllers\Api;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends ApiController
{
    /**
     * Roles that should not be renamed or deleted.
     *
     * @var array<int, string>
     */
    private const PROTECTED_ROLES = [
        'sysadmin',
    ];

    public function list(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view roles', 'You do not have permission to view roles')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'guard' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $validated = $validator->validated();
        $search = $validated['search'] ?? null;
        $guard = $validated['guard'] ?? null;

        $query = Role::query()
            ->with('permissions:id,name,guard_name')
            ->orderBy('name');

        if ($search) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        if ($guard) {
            $query->where('guard_name', $guard);
        }

        $roles = $query->get()->map(function (Role $role) {
            return $this->transformRole($role);
        })->values();

        $permissions = Permission::orderBy('name')
            ->get(['id', 'name', 'guard_name', 'created_at', 'updated_at'])
            ->makeHidden(['pivot']);

        return $this->success([
            'roles' => $roles,
            'permissions' => $permissions,
        ], 'Roles retrieved successfully', $roles->count());
    }

    public function get(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view roles', 'You do not have permission to view roles')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:roles,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $role = Role::with('permissions:id,name,guard_name')->findOrFail($request->id);

        return $this->success([
            'role' => $this->transformRole($role),
        ], 'Role retrieved successfully');
    }

    public function create(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('create roles', 'You do not have permission to create roles')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'guard_name' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => [
                'string',
                'distinct',
                Rule::exists('permissions', 'name'),
            ],
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        $normalizedName = $this->normalizeRoleName($data['name']);

        if (!$normalizedName) {
            return $this->validationError(['name' => ['Role name cannot be empty']]);
        }

        $guardName = $data['guard_name'] ?? 'web';

        $exists = Role::where('name', $normalizedName)
            ->where('guard_name', $guardName)
            ->exists();

        if ($exists) {
            return $this->validationError(['name' => ['Role name already exists']]);
        }

        $role = Role::create([
            'name' => $normalizedName,
            'guard_name' => $guardName,
        ]);

        $permissions = $this->filterValidPermissions($data['permissions'] ?? []);
        $role->syncPermissions($permissions);

        $this->refreshPermissionCache();

        return $this->success([
            'role' => $this->transformRole($role->fresh('permissions')),
        ], 'Role created successfully');
    }

    public function update(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('edit roles', 'You do not have permission to edit roles')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:roles,id',
            'name' => 'required|string|max:255',
            'guard_name' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => [
                'string',
                'distinct',
                Rule::exists('permissions', 'name'),
            ],
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        $role = Role::with('permissions:id,name,guard_name')->findOrFail($data['id']);

        $normalizedName = $this->normalizeRoleName($data['name']);

        if (!$normalizedName) {
            return $this->validationError(['name' => ['Role name cannot be empty']]);
        }

        $guardName = $data['guard_name'] ?? $role->guard_name ?? 'web';

        $exists = Role::where('id', '!=', $role->id)
            ->where('name', $normalizedName)
            ->where('guard_name', $guardName)
            ->exists();

        if ($exists) {
            return $this->validationError(['name' => ['Role name already exists']]);
        }

        if ($this->isProtectedRole($role) && $role->name !== $normalizedName) {
            return $this->validationError(['name' => ['This role is protected and cannot be renamed']]);
        }

        $role->name = $normalizedName;
        $role->guard_name = $guardName;
        $role->save();

        $permissions = $this->filterValidPermissions($data['permissions'] ?? []);
        $role->syncPermissions($permissions);

        $this->refreshPermissionCache();

        return $this->success([
            'role' => $this->transformRole($role->fresh('permissions')),
        ], 'Role updated successfully');
    }

    public function delete(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('delete roles', 'You do not have permission to delete roles')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:roles,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $role = Role::findOrFail($request->id);

        if ($this->isProtectedRole($role)) {
            return $this->error('This role is protected and cannot be deleted');
        }

        $role->delete();

        $this->refreshPermissionCache();

        return $this->success(null, 'Role deleted successfully');
    }

    private function normalizeRoleName(string $name): string
    {
        return Str::slug(Str::lower($name), '_');
    }

    private function isProtectedRole(Role $role): bool
    {
        return in_array($role->name, self::PROTECTED_ROLES, true);
    }

    private function transformRole(Role $role): Role
    {
        if ($role->relationLoaded('permissions')) {
            $role->permissions->makeHidden(['pivot']);
        }

        $role->setAttribute('is_protected', $this->isProtectedRole($role));

        return $role;
    }

    /**
     * @param  array<int, string>  $permissionNames
     * @return array<int, string>
     */
    private function filterValidPermissions(array $permissionNames): array
    {
        if (empty($permissionNames)) {
            return [];
        }

        $valid = Permission::whereIn('name', $permissionNames)->pluck('name')->all();

        if (empty($valid)) {
            return [];
        }

        return $valid;
    }

    private function refreshPermissionCache(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
