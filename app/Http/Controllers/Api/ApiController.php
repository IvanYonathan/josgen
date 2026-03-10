<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ApiController extends Controller
{
    protected const NOT_AUTHENTICATED = 'Not authenticated';

    /**
     * Get the storage disk for file uploads.
     * Uses R2 in production when configured, falls back to local public disk.
     */
    protected function storageDisk(): string
    {
        return config('filesystems.disks.r2.key') ? 'r2' : 'public';
    }
    /**
     * Return a success response
     */
    protected function success($data = null, string $message = 'Operation successful', int $total = null): JsonResponse
    {
        $response = [
            'status' => true,
            'code' => 200,
            'data' => $data,
        ];

        // Add total for list responses
        if ($total !== null) {
            $response['total'] = $total;
        }

        return response()->json($response);
    }

    /**
     * Return an error response
     */
    protected function error(string $message = 'Operation failed', $errors = null, int $statusCode = 400): JsonResponse
    {
        return response()->json([
            'status' => false,
            'code' => $statusCode,
            'message' => $message,
            'errors' => $errors,
        ], $statusCode);
    }

    /**
     * Return a validation error response
     */
    protected function validationError($errors, string $message = 'Validation failed'): JsonResponse
    {
        return response()->json([
            'status' => false,
            'code' => 422,
            'message' => $message,
            'errors' => $errors,
        ], 422);
    }

    /**
     * Return an unauthorized response
     */
    protected function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return response()->json([
            'status' => false,
            'code' => 401,
            'message' => $message,
        ], 401);
    }

    /**
     * Return a forbidden response
     */
    protected function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return response()->json([
            'status' => false,
            'code' => 403,
            'message' => $message,
        ], 403);
    }

    /**
     * Return a not found response
     */
    protected function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return response()->json([
            'status' => false,
            'code' => 404,
            'message' => $message,
        ], 404);
    }

    /**
     * Ensure the current user has the specified permission.
     *
     * This method properly handles the guard switching required for Spatie Permission
     * to work with Sanctum authentication. Returns null if permission is granted,
     * or error response if denied.
     *
     * @param string $permission The permission name to check
     * @param string $message The error message to return if permission is denied
     * @return JsonResponse|null Null if allowed, error response if denied
     */
    protected function ensurePermission(string $permission, string $message): ?JsonResponse
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

    /**
     * Check if the current user has the specified permission.
     *
     * This method properly handles the guard switching required for Spatie Permission
     * to work with Sanctum authentication. Use this for compound permission checks.
     *
     * @param string $permission The permission name to check
     * @return bool True if user has permission, false otherwise
     */
    protected function hasPermission(string $permission): bool
    {
        $user = Auth::user();

        if (!$user) {
            return false;
        }

        $originalGuard = config('auth.defaults.guard');
        config(['auth.defaults.guard' => 'web']);

        $allowed = $user->can($permission);

        config(['auth.defaults.guard' => $originalGuard]);

        return $allowed;
    }
}