<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ApiController extends Controller
{
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
}