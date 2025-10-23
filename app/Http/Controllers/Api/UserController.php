<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends ApiController
{
    const NOT_AUTHENTICATED = 'Not authenticated';
    public function list(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized(self::NOT_AUTHENTICATED);
        }

        // Temporarily set default guard to 'web' for permission checks
        // And also the same for the rest of the methods
        config(['auth.defaults.guard' => 'web']);

        if (!$user->can('view users')) {
            return $this->forbidden('You do not have permission to view users');
        }

        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:100',
            'filters' => 'nullable|array',
            'filters.name' => 'nullable|string',
            'filters.email' => 'nullable|string',
            'filters.role' => ['nullable', Rule::in(['Sysadmin', 'Division_Leader', 'Treasurer', 'Member'])],
            'filters.division_id' => 'nullable|integer|exists:divisions,id',
            'sort' => 'nullable|array',
            'sort.*' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $validated = $validator->validated();

        $page = (int) ($validated['page'] ?? 1);
        $limit = (int) min($validated['limit'] ?? 10, 100);
        $filters = $validated['filters'] ?? [];
        $sort = $validated['sort'] ?? [];

        $query = User::query()->with(['roles', 'division:id,name']);

        $search = $filters['name'] ??  null;
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['email'])) {
            $query->where('email', 'like', '%' . $filters['email'] . '%');
        }

        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (!empty($filters['division_id'])) {
            $query->where('division_id', $filters['division_id']);
        }

        $sortableColumns = [
            'name' => 'name',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];

        $appliedSort = false;
        foreach ($sort as $field => $direction) {
            if (isset($sortableColumns[$field])) {
                $query->orderBy(
                    $sortableColumns[$field],
                    strtolower($direction) === 'asc' ? 'asc' : 'desc'
                );
                $appliedSort = true;
            }
        }

        if (!$appliedSort) {
            $query->orderBy('created_at', 'asc');
        }

        $total = (clone $query)->count();

        $page = max(1, $page);
        $offset = ($page - 1) * $limit;

        $users = (clone $query)
            ->skip($offset)
            ->take($limit)
            ->get()
            ->makeHidden(['password', 'remember_token']);

        return $this->success([
            'users' => $users,
        ], 'Users retrieved successfully', $total);
    }

    public function get(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized(self::NOT_AUTHENTICATED);
        }

        config(['auth.defaults.guard' => 'web']);

        if (!$user->can('view users')) {
            return $this->forbidden('You do not have permission to view users');
        }

        $userData = User::with(['roles', 'division'])
            ->findOrFail($request->id)
            ->makeHidden(['password', 'remember_token']);

        return $this->success([
            'user' => $userData,
        ], 'User retrieved successfully');
    }

    public function create(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized(self::NOT_AUTHENTICATED);
        }

        config(['auth.defaults.guard' => 'web']);

        if (!$user->can('create users')) {
            return $this->forbidden('You do not have permission to create users');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:Sysadmin,Division_Leader,Treasurer,Member',
            'birthday' => 'nullable|date',
            'division_id' => 'nullable|exists:divisions,id',
            'ava' => 'nullable|string',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $data['ava'] = basename($avatarPath);
        }

        unset($data['avatar']);
        $data['password'] = Hash::make($data['password']);

        $newUser = User::create($data);

        $roleMap = [
            'Sysadmin' => 'sysadmin',
            'Division_Leader' => 'division_leader',
            'Treasurer' => 'treasurer',
            'Member' => 'member',
        ];

        $roleName = $roleMap[$data['role']] ?? strtolower($data['role']);

        // Assign the correct role
        $newUser->assignRole($roleName);

        return $this->success([
            'user' => $newUser->load('roles', 'division'),
        ], 'User created successfully');
    }


    public function update(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized(self::NOT_AUTHENTICATED);
        }

        config(['auth.defaults.guard' => 'web']);

        if (!$user->can('edit users')) {
            return $this->forbidden('You do not have permission to edit users');
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:users,id',
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($request->id),
            ],
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:Sysadmin,Division_Leader,Treasurer,Member',
            'birthday' => 'nullable|date',
            'division_id' => 'nullable|exists:divisions,id',
            'ava' => 'nullable|string',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        $userToUpdate = User::findOrFail($data['id']);

        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $data['ava'] = basename($avatarPath);
        }
        unset($data['avatar']);

        $userToUpdate->update($data);

        $roleMap = [
            'Sysadmin' => 'sysadmin',
            'Division_Leader' => 'division_leader',
            'Treasurer' => 'treasurer',
            'Member' => 'member',
        ];
        $roleName = $roleMap[$data['role']] ?? strtolower($data['role']);
        $userToUpdate->syncRoles([$roleName]);

        return $this->success([
            'user' => $userToUpdate->load('roles', 'division'),
        ], 'User updated successfully');
    }



    public function delete(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorized(self::NOT_AUTHENTICATED);
        }

        config(['auth.defaults.guard' => 'web']);

        if (!$user->can('delete users')) {
            return $this->forbidden('You do not have permission to delete users');
        }

        $userToDelete = User::findOrFail($request->id);

        if ($userToDelete->id === Auth::id()) {
            return $this->error('You cannot delete your own account');
        }

        $userToDelete->delete();

        return $this->success(null, 'User deleted successfully');
    }

    public function profile(Request $request): JsonResponse
    {
        /** @var User $user */ //->$user is specifically a User instance

        $user = Auth::user();

        $user->load(['roles', 'division']);
        $user->makeHidden(['password', 'remember_token']);

        return $this->success([
            'user' => $user,
        ], 'Profile retrieved successfully');
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'birthday' => 'nullable|date',
            'ava' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return $this->success([
            'user' => $user->load('roles', 'division'),
        ], 'Profile updated successfully');
    }
}
