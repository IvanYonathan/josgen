<?php

namespace App\Http\Controllers\Api;

use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Support\PermissionRegistry;

class PermissionController extends ApiController
{
    public function list(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view permissions', 'You do not have permission to view permissions')) {
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

    private function transformPermission(Permission $permission): Permission
    {
        if ($permission->relationLoaded('roles')) {
            $permission->roles->makeHidden(['pivot']);
        }

        return $permission;
    }

}
