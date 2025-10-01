<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * List all users
     */
    public function list(Request $request): JsonResponse
    {
        try {
            $users = User::select('id', 'name', 'email', 'created_at', 'updated_at')
                ->orderBy('name')
                ->get();

            return response()->json([
                'status' => true,
                'code' => 200,
                'data' => $users,
                'total' => $users->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'code' => 500,
                'message' => 'Failed to retrieve users: ' . $e->getMessage()
            ], 500);
        }
    }
}