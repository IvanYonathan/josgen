<?php

namespace App\Http\Controllers\Api;

use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\Permission\PermissionRegistrar;
use App\Support\PermissionSynchronizer;
use App\Support\PermissionRegistry;

class PermissionController extends ApiController
{
    private const NOT_AUTHENTICATED = 'Not authenticated';

    public function list(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view permissions', 'You do not have permission to view permissions')) {
            return $response;
        }

        PermissionSynchronizer::sync();

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

        $query = Permission::query()
            ->with('roles:id,name,guard_name')
            ->orderBy('name');

        if ($search) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        if ($guard) {
            $query->where('guard_name', $guard);
        }

        $permissions = $query->get()->map(function (Permission $permission) {
            return $this->transformPermission($permission);
        })->values();

        return $this->success([
            'permissions' => $permissions,
            'definitions' => PermissionRegistry::permissionRoleMap(),
        ], 'Permissions retrieved successfully', $permissions->count());
    }

    public function get(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view permissions', 'You do not have permission to view permissions')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $permission = Permission::with('roles:id,name,guard_name')->findOrFail($request->id);

        return $this->success([
            'permission' => $this->transformPermission($permission),
        ], 'Permission retrieved successfully');
    }

    public function create(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('create permissions', 'You do not have permission to create permissions')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'guard_name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        $normalizedName = $this->normalizePermissionName($data['name']);

        if (!$normalizedName) {
            return $this->validationError(['name' => ['Permission name cannot be empty']]);
        }

        $guardName = $data['guard_name'] ?? 'web';

        $nameRule = Rule::unique('permissions')->where(function ($query) use ($guardName) {
            return $query->where('guard_name', $guardName);
        });

        $duplicateValidator = Validator::make([
            'name' => $normalizedName,
        ], [
            'name' => ['required', $nameRule],
        ]);

        if ($duplicateValidator->fails()) {
            return $this->validationError($duplicateValidator->errors());
        }

        $permission = Permission::create([
            'name' => $normalizedName,
            'guard_name' => $guardName,
        ]);

        $this->refreshPermissionCache();

        return $this->success([
            'permission' => $this->transformPermission($permission->fresh('roles')),
        ], 'Permission created successfully');
    }

    public function update(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('edit permissions', 'You do not have permission to edit permissions')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:permissions,id',
            'name' => 'required|string|max:255',
            'guard_name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        $permission = Permission::findOrFail($data['id']);

        $normalizedName = $this->normalizePermissionName($data['name']);

        if (!$normalizedName) {
            return $this->validationError(['name' => ['Permission name cannot be empty']]);
        }

        $guardName = $data['guard_name'] ?? $permission->guard_name ?? 'web';

        $nameRule = Rule::unique('permissions')
            ->ignore($permission->id)
            ->where(function ($query) use ($guardName) {
                return $query->where('guard_name', $guardName);
            });

        $duplicateValidator = Validator::make([
            'name' => $normalizedName,
        ], [
            'name' => ['required', $nameRule],
        ]);

        if ($duplicateValidator->fails()) {
            return $this->validationError($duplicateValidator->errors());
        }

        $permission->name = $normalizedName;
        $permission->guard_name = $guardName;
        $permission->save();

        $this->refreshPermissionCache();

        return $this->success([
            'permission' => $this->transformPermission($permission->fresh('roles')),
        ], 'Permission updated successfully');
    }

    public function delete(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('delete permissions', 'You do not have permission to delete permissions')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $permission = Permission::findOrFail($request->id);

        // Detach assigned roles before removing the permission
        $permission->roles()->detach();
        $permission->delete();

        $this->refreshPermissionCache();

        return $this->success(null, 'Permission deleted successfully');
    }

    private function normalizePermissionName(string $name): string
    {
        return (string) Str::of($name)->squish()->lower();
    }

    private function ensurePermission(string $permission, string $message): ?JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized(self::NOT_AUTHENTICATED);
        }

        $originalGuard = config('auth.defaults.guard');
        config(['auth.defaults.guard' => 'web']);

        $allowed = $user->can($permission);

        config(['auth.defaults.guard' => $originalGuard]);

        if (!$allowed) {
            return $this->forbidden($message);
        }

        return null;
    }

    private function transformPermission(Permission $permission): Permission
    {
        if ($permission->relationLoaded('roles')) {
            $permission->roles->makeHidden(['pivot']);
        }

        return $permission;
    }

    private function refreshPermissionCache(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
