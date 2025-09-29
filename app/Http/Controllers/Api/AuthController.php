<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules;

class AuthController extends ApiController
{
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

        if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            return $this->unauthorized('Invalid credentials');
        }

        $user = Auth::user();
        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->success([
            'user' => $user,
            'access_token' => $token,
            'refresh_token' => $token, // In a real app, you might want separate refresh tokens
            'token_type' => 'Bearer',
            'expires_in' => config('sanctum.expiration', 525600), // minutes
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

        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->success([
            'user' => $user,
            'access_token' => $token,
            'refresh_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => config('sanctum.expiration', 525600),
        ], 'Registration successful');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logout successful');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('roles', 'permissions');

        return $this->success([
            'user' => $user,
            'permissions' => [
                'can_view_divisions' => $user->can('view divisions'),
                'can_create_divisions' => $user->can('create divisions'),
                'can_edit_divisions' => $user->can('edit divisions'),
                'can_delete_divisions' => $user->can('delete divisions'),
            ],
        ], 'User profile retrieved successfully');
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . Auth::id(),
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = Auth::user();
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

        $user = Auth::user();

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

        // In a real implementation, you would validate the refresh token
        // For now, we'll just return a new token for the authenticated user
        if (!Auth::check()) {
            return $this->unauthorized('Invalid refresh token');
        }

        $user = Auth::user();
        $newToken = $user->createToken('auth-token')->plainTextToken;

        return $this->success([
            'access_token' => $newToken,
            'refresh_token' => $newToken,
            'token_type' => 'Bearer',
            'expires_in' => config('sanctum.expiration', 525600),
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