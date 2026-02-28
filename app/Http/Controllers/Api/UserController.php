<?php

namespace App\Http\Controllers\Api;

use App\Mail\NewUserCredentialsMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends ApiController
{
    public function list(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('view users', 'You do not have permission to view users')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:100',
            'filters' => 'nullable|array',
            'filters.name' => 'nullable|string',
            'filters.email' => 'nullable|string',
            'filters.role' => ['nullable', 'string', 'max:255', Rule::exists('roles', 'name')],
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

        $users->each(function (User $user) {
            $this->appendPrimaryRole($user);
        });

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

        if ($response = $this->ensurePermission('view users', 'You do not have permission to view users')) {
            return $response;
        }

        $userData = User::with(['roles', 'division'])
            ->findOrFail($request->id)
            ->makeHidden(['password', 'remember_token']);

        $this->appendPrimaryRole($userData);

        return $this->success([
            'user' => $userData,
        ], 'User retrieved successfully');
    }

    public function create(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('create users', 'You do not have permission to create users')) {
            return $response;
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => ['required', 'string', 'max:255', Rule::exists('roles', 'name')],
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

        // Use the admin-supplied password as plain text.
        // The User model's 'hashed' cast handles hashing on create().
        $plainPassword = $data['password'];

        $roleName = $data['role'];

        $newUser = User::create($data);

        // Assign the correct role - specify 'web' guard to match role's guard
        $role = \Spatie\Permission\Models\Role::findByName($roleName, 'web');
        $newUser->assignRole($role);
        $newUser->load('roles', 'division');
        $this->appendPrimaryRole($newUser);

        // Send credentials email to the new user
        Mail::to($newUser)->queue(new NewUserCredentialsMail($newUser, $plainPassword));

        return $this->success([
            'user' => $newUser,
        ], 'User created successfully');
    }


    public function update(Request $request): JsonResponse
    {
        if ($response = $this->ensurePermission('edit users', 'You do not have permission to edit users')) {
            return $response;
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
            'role' => ['required', 'string', 'max:255', Rule::exists('roles', 'name')],
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

        $roleName = $data['role'];
        // Sync roles - specify 'web' guard to match role's guard
        $role = \Spatie\Permission\Models\Role::findByName($roleName, 'web');
        $userToUpdate->syncRoles([$role]);
        $userToUpdate->load('roles', 'division');
        $this->appendPrimaryRole($userToUpdate);

        return $this->success([
            'user' => $userToUpdate,
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

        if ($response = $this->ensurePermission('delete users', 'You do not have permission to delete users')) {
            return $response;
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
        $this->appendPrimaryRole($user);
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

        $user->load('roles', 'division');
        $this->appendPrimaryRole($user);

        return $this->success([
            'user' => $user,
        ], 'Profile updated successfully');
    }

    /**
     * Normalize the exposed role attribute so clients always receive the primary role slug.
     */
    private function appendPrimaryRole(User $user): void
    {
        $user->loadMissing('roles');
        $primaryRole = $user->roles->pluck('name')->first();

        if ($primaryRole) {
            if ($user->getAttribute('role') !== $primaryRole) {
                $user->forceFill(['role' => $primaryRole])->save();
            }
            $user->setAttribute('role', $primaryRole);
        }
    }
}
