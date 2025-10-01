<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DivisionController;
use App\Http\Controllers\Api\UserController;
// use App\Http\Controllers\Api\EventController;
// use App\Http\Controllers\Api\ProjectController;
// use App\Http\Controllers\Api\TodoListController;
// use App\Http\Controllers\Api\NoteController;
// use App\Http\Controllers\Api\TreasuryController;
use Illuminate\Support\Facades\Route;

// Auth endpoints (no auth required)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// Protected endpoints (require authentication)
Route::middleware(['auth:web,sanctum'])->group(function () {

    // Auth (authenticated)
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('me', [AuthController::class, 'me']);
        Route::post('update-profile', [AuthController::class, 'updateProfile']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
    });

    // User endpoints
    Route::prefix('user')->group(function () {
        Route::post('list', [UserController::class, 'list']);
    });

    // Division endpoints
    Route::prefix('division')->group(function () {
        Route::post('list', [DivisionController::class, 'list']);
        Route::post('get', [DivisionController::class, 'get']);
        Route::post('create', [DivisionController::class, 'create']);
        Route::post('update', [DivisionController::class, 'update']);
        Route::post('delete', [DivisionController::class, 'delete']);
        Route::post('members/list', [DivisionController::class, 'membersList']);
        Route::post('members/add', [DivisionController::class, 'addMember']);
        Route::post('members/add-bulk', [DivisionController::class, 'addMembers']);
        Route::post('members/remove', [DivisionController::class, 'removeMember']);
    });

    // TODO: Uncomment when controllers are created
    /*
    // Event endpoints
    Route::prefix('event')->group(function () {
        Route::post('list', [EventController::class, 'list']);
        Route::post('get', [EventController::class, 'get']);
        Route::post('create', [EventController::class, 'create']);
        Route::post('update', [EventController::class, 'update']);
        Route::post('delete', [EventController::class, 'delete']);
    });

    // Project endpoints
    Route::prefix('project')->group(function () {
        Route::post('list', [ProjectController::class, 'list']);
        Route::post('get', [ProjectController::class, 'get']);
        Route::post('create', [ProjectController::class, 'create']);
        Route::post('update', [ProjectController::class, 'update']);
        Route::post('delete', [ProjectController::class, 'delete']);
    });

    // TodoList endpoints
    Route::prefix('todo-list')->group(function () {
        Route::post('list', [TodoListController::class, 'list']);
        Route::post('get', [TodoListController::class, 'get']);
        Route::post('create', [TodoListController::class, 'create']);
        Route::post('update', [TodoListController::class, 'update']);
        Route::post('delete', [TodoListController::class, 'delete']);
        Route::post('items/list', [TodoListController::class, 'itemsList']);
        Route::post('items/add', [TodoListController::class, 'addItem']);
        Route::post('items/update', [TodoListController::class, 'updateItem']);
        Route::post('items/delete', [TodoListController::class, 'deleteItem']);
        Route::post('items/toggle', [TodoListController::class, 'toggleItem']);
    });

    // Note endpoints
    Route::prefix('note')->group(function () {
        Route::post('list', [NoteController::class, 'list']);
        Route::post('get', [NoteController::class, 'get']);
        Route::post('create', [NoteController::class, 'create']);
        Route::post('update', [NoteController::class, 'update']);
        Route::post('delete', [NoteController::class, 'delete']);
    });

    // Treasury endpoints
    Route::prefix('treasury')->group(function () {
        Route::post('requests/list', [TreasuryController::class, 'requestsList']);
        Route::post('requests/get', [TreasuryController::class, 'getRequest']);
        Route::post('requests/create', [TreasuryController::class, 'createRequest']);
        Route::post('requests/update', [TreasuryController::class, 'updateRequest']);
        Route::post('requests/delete', [TreasuryController::class, 'deleteRequest']);
        Route::post('requests/approve', [TreasuryController::class, 'approveRequest']);
        Route::post('requests/reject', [TreasuryController::class, 'rejectRequest']);
    });
    */
});