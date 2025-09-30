<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // SPA Entry Point - All application routes now handled by React Router
    Route::get('/{any}', function () {
        return Inertia::render('app');
    })->where('any', '^(?!api|auth|settings).*$')->name('spa');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
