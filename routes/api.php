<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DailyVerseController;
use App\Http\Controllers\Api\DivisionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\ImageController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TodoListController;
use App\Http\Controllers\Api\TreasuryController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\GoogleCalendarController;
use Illuminate\Support\Facades\Route;

// Auth endpoints (no auth required)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// Google Calendar OAuth callback (no auth - Google redirects here)
Route::get('google-calendar/callback', [GoogleCalendarController::class, 'callback']);

// Daily Verse endpoints (public - no auth required)
Route::prefix('daily-verse')->group(function () {
    Route::get('/', [DailyVerseController::class, 'index']);
    Route::get('/by-date', [DailyVerseController::class, 'getByDate']);
    Route::get('/upcoming', [DailyVerseController::class, 'upcoming']);
});

// Protected endpoints (require authentication via Sanctum token)
Route::middleware(['auth:sanctum'])->group(function () {

    // Auth (authenticated)
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('me', [AuthController::class, 'me']);
        Route::post('update-profile', [AuthController::class, 'updateProfile']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
    });

    // User endpoints
    // Route::prefix('users')->group(function () {
    //     Route::get('/', [UserController::class, 'list']);
    //     Route::get('/profile', [UserController::class, 'profile']);
    //     Route::post('/profile', [UserController::class, 'updateProfile']);
    //     Route::get('/{id}', [UserController::class, 'get']);
    //     Route::post('/create', [UserController::class, 'create']);
    //     Route::put('/{id}', [UserController::class, 'update']);
    //     Route::delete('/{id}', [UserController::class, 'delete']);
    // });

    Route::prefix('user')->group(function () {
        Route::post('list', [UserController::class, 'list']);
        Route::post('options', [UserController::class, 'options']);
        Route::post('get', [UserController::class, 'get']);
        Route::post('create', [UserController::class, 'create']);
        Route::post('update', [UserController::class, 'update']);
        Route::post('delete', [UserController::class, 'delete']);
        Route::post('profile', [UserController::class, 'profile']);
        Route::post('profile/update', [UserController::class, 'updateProfile']);
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

    // Role endpoints
    Route::prefix('role')->group(function () {
        Route::post('list', [RoleController::class, 'list']);
        Route::post('get', [RoleController::class, 'get']);
        Route::post('create', [RoleController::class, 'create']);
        Route::post('update', [RoleController::class, 'update']);
        Route::post('delete', [RoleController::class, 'delete']);
    });

    // Permission endpoints
    Route::prefix('permission')->group(function () {
        Route::post('list', [PermissionController::class, 'list']);
        Route::post('get', [PermissionController::class, 'get']);
    });

    // Event endpoints
    Route::prefix('event')->group(function () {
        Route::post('list', [EventController::class, 'list']);
        Route::post('get', [EventController::class, 'get']);
        Route::post('create', [EventController::class, 'create']);
        Route::post('update', [EventController::class, 'update']);
        Route::post('delete', [EventController::class, 'delete']);
        Route::post('cancel', [EventController::class, 'cancel']);
        Route::post('participants/add', [EventController::class, 'addParticipants']);
        Route::post('participants/remove', [EventController::class, 'removeParticipants']);
    });

    // Project endpoints
    Route::prefix('project')->group(function () {
        Route::post('list', [ProjectController::class, 'list']);
        Route::post('get', [ProjectController::class, 'get']);
        Route::post('create', [ProjectController::class, 'create']);
        Route::post('update', [ProjectController::class, 'update']);
        Route::post('delete', [ProjectController::class, 'delete']);
        Route::post('members/add', [ProjectController::class, 'addMembers']);
        Route::post('members/remove', [ProjectController::class, 'removeMembers']);
        Route::post('tasks/create', [ProjectController::class, 'createTask']);
        Route::post('tasks/update', [ProjectController::class, 'updateTask']);
        Route::post('tasks/delete', [ProjectController::class, 'deleteTask']);
        Route::post('tasks/toggle-completion', [ProjectController::class, 'toggleTaskCompletion']);
    });

    // TODO: Uncomment when controllers are created

    // TodoList endpoints
    Route::prefix('todo-list')->group(function () {
        Route::post('list', [TodoListController::class, 'list']);
        Route::post('get', [TodoListController::class, 'get']);
        Route::post('create', [TodoListController::class, 'create']);
        Route::post('update', [TodoListController::class, 'update']);
        Route::post('delete', [TodoListController::class, 'delete']);
        Route::post('items/add', [TodoListController::class, 'addItem']);
        Route::post('items/update', [TodoListController::class, 'updateItem']);
        Route::post('items/delete', [TodoListController::class, 'deleteItem']);
        Route::post('items/toggle', [TodoListController::class, 'toggleItem']);
    });

    // Treasury endpoints
    Route::prefix('treasury')->group(function () {
        // Treasury Requests
        Route::post('list', [TreasuryController::class, 'list']);
        Route::post('get', [TreasuryController::class, 'get']);
        Route::post('create', [TreasuryController::class, 'create']);
        Route::post('update', [TreasuryController::class, 'update']);
        Route::post('delete', [TreasuryController::class, 'delete']);
        Route::post('submit', [TreasuryController::class, 'submit']);
        Route::post('approve', [TreasuryController::class, 'approve']);
        Route::post('reject', [TreasuryController::class, 'reject']);
        Route::post('mark-paid', [TreasuryController::class, 'markPaid']);
        Route::post('stats', [TreasuryController::class, 'stats']);
        Route::post('categories', [TreasuryController::class, 'categories']);
        Route::post('attachment/upload', [TreasuryController::class, 'uploadAttachment']);
        Route::post('attachment/delete', [TreasuryController::class, 'deleteAttachment']);
        
        // Financial Records (Treasurer-managed organization transactions)
        Route::post('records/list', [TreasuryController::class, 'listRecords']);
        Route::post('records/create', [TreasuryController::class, 'createRecord']);
        Route::post('records/update', [TreasuryController::class, 'updateRecord']);
        Route::post('records/delete', [TreasuryController::class, 'deleteRecord']);
        Route::post('records/categories', [TreasuryController::class, 'recordCategories']);
    });

    // Note endpoints
    Route::prefix('note')->group(function () {
        Route::post('list', [NoteController::class, 'list']);
        Route::post('get', [NoteController::class, 'get']);
        Route::post('create', [NoteController::class, 'create']);
        Route::post('update', [NoteController::class, 'update']);
        Route::post('delete', [NoteController::class, 'delete']);
    });

    // Image endpoints
    Route::prefix('image')->group(function () {
        Route::post('upload', [ImageController::class, 'upload']);
        Route::post('delete', [ImageController::class, 'delete']);
    });

    // Notification endpoints
    Route::prefix('notification')->group(function () {
        Route::post('list', [NotificationController::class, 'list']);
        Route::post('unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('mark-read', [NotificationController::class, 'markRead']);
        Route::post('mark-all-read', [NotificationController::class, 'markAllRead']);
        Route::post('clear-all', [NotificationController::class, 'clearAll']);
    });

    // Google Calendar endpoints
    Route::prefix('google-calendar')->group(function () {
        Route::post('connect', [GoogleCalendarController::class, 'connect']);
        Route::post('disconnect', [GoogleCalendarController::class, 'disconnect']);
        Route::post('status', [GoogleCalendarController::class, 'status']);
    });
});
