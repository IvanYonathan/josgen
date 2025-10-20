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
    public function list(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !$user->can('view users')) {
            return $this->forbidden('You do not have permission to view users');
        }

        $users = User::with(['roles', 'division:id,name'])
            ->get()
            ->makeHidden(['password', 'remember_token']);

        return $this->success($users, 'Users retrieved successfully', $users->count());
    }

    public function get(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();

        if (!$user || !$user->can('view users')) {
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
        $user = Auth::user();

        if (!$user || !$user->can('create users')) {
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

        // Create user first
        $newUser = User::create($data);

        // Role mapping (same as in update)
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
        $user = Auth::user();

        if (!$user || !$user->can('edit users')) {
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
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:Sysadmin,Division_Leader,Treasurer,Member',
            'birthday' => 'nullable|date',
            'division_id' => 'nullable|exists:divisions,id',
            'ava' => 'nullable|string',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048', // ✅ add this
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $validator->validated();
        $userToUpdate = User::findOrFail($data['id']);

        // ✅ Handle avatar upload
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $data['ava'] = basename($avatarPath);
        }
        unset($data['avatar']);

        // Handle password
        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

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

        $user = Auth::user();

        if (!$user || !$user->can('delete users')) {
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
