<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends ApiController
{
    private const ACCESS_TOKEN_EXPIRY_MINUTES = 60;
    private const REFRESH_TOKEN_EXPIRY_DAYS = 7;

    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'remember' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->unauthorized('Invalid credentials');
        }

        $accessToken = $user->createToken(
            'access-token',
            ['*'],
            now()->addMinutes(self::ACCESS_TOKEN_EXPIRY_MINUTES)
        );

        $refreshToken = $user->createToken(
            'refresh-token',
            ['*'],
            now()->addDays(self::REFRESH_TOKEN_EXPIRY_DAYS)
        );

        return $this->success([
            'user' => $user,
            'access_token' => $accessToken->plainTextToken,
            'refresh_token' => $refreshToken->plainTextToken,
            'token_type' => 'Bearer',
            'expires_in' => self::ACCESS_TOKEN_EXPIRY_MINUTES,
        ], 'Login successful');
    }

    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $accessToken = $user->createToken(
            'access-token',
            ['*'],
            now()->addMinutes(self::ACCESS_TOKEN_EXPIRY_MINUTES)
        );

        $refreshToken = $user->createToken(
            'refresh-token',
            ['*'],
            now()->addDays(self::REFRESH_TOKEN_EXPIRY_DAYS)
        );

        return $this->success([
            'user' => $user,
            'access_token' => $accessToken->plainTextToken,
            'refresh_token' => $refreshToken->plainTextToken,
            'token_type' => 'Bearer',
            'expires_in' => self::ACCESS_TOKEN_EXPIRY_MINUTES,
        ], 'Registration successful');
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            // Delete all tokens for this user (access + refresh)
            $user->tokens()->delete();
        }

        return $this->success(null, 'Logout successful');
    }

    public function me(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $user->load('roles', 'permissions');

        // Temporarily set default guard to 'web' for permission checks
        $originalGuard = config('auth.defaults.guard');
        config(['auth.defaults.guard' => 'web']);

        $permissions = [
            'can_view_divisions' => $user->can('view divisions'),
            'can_create_divisions' => $user->can('create divisions'),
            'can_edit_divisions' => $user->can('edit divisions'),
            'can_delete_divisions' => $user->can('delete divisions'),
            'can_view_users' => $user->can('view users'),
            'can_create_users' => $user->can('create users'),
            'can_edit_users' => $user->can('edit users'),
            'can_delete_users' => $user->can('delete users'),
            'can_view_roles' => $user->can('view roles'),
            'can_create_roles' => $user->can('create roles'),
            'can_edit_roles' => $user->can('edit roles'),
            'can_delete_roles' => $user->can('delete roles'),
            'can_view_permissions' => $user->can('view permissions'),
            'can_create_permissions' => $user->can('create permissions'),
            'can_edit_permissions' => $user->can('edit permissions'),
            'can_delete_permissions' => $user->can('delete permissions'),
        ];

        // Restore original guard
        config(['auth.defaults.guard' => $originalGuard]);

        return $this->success([
            'user' => $user,
            'permissions' => $permissions,
        ], 'User profile retrieved successfully');
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user->update($validator->validated());

        return $this->success([
            'user' => $user,
        ], 'Profile updated successfully');
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->error('Current password is incorrect');
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return $this->success(null, 'Password changed successfully');
    }

    public function refresh(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'refresh_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $token = PersonalAccessToken::findToken($request->input('refresh_token'));

        if (!$token || $token->name !== 'refresh-token') {
            return $this->unauthorized('Invalid refresh token');
        }

        if ($token->expires_at && $token->expires_at->isPast()) {
            $token->delete();
            return $this->unauthorized('Refresh token expired');
        }

        $user = $token->tokenable;

        // Delete the used refresh token and all expired access tokens for this user
        $token->delete();
        $user->tokens()->where('name', 'access-token')->where('expires_at', '<', now())->delete();

        $newAccessToken = $user->createToken(
            'access-token',
            ['*'],
            now()->addMinutes(self::ACCESS_TOKEN_EXPIRY_MINUTES)
        );

        $newRefreshToken = $user->createToken(
            'refresh-token',
            ['*'],
            now()->addDays(self::REFRESH_TOKEN_EXPIRY_DAYS)
        );

        return $this->success([
            'access_token' => $newAccessToken->plainTextToken,
            'refresh_token' => $newRefreshToken->plainTextToken,
            'token_type' => 'Bearer',
            'expires_in' => self::ACCESS_TOKEN_EXPIRY_MINUTES,
        ], 'Token refreshed successfully');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        // Implement password reset logic here
        // This would typically send a reset email

        return $this->success(null, 'Password reset email sent');
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        // Implement password reset logic here
        // This would validate the token and reset the password

        return $this->success(null, 'Password reset successfully');
    }
}
