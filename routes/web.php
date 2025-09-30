<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// SPA Entry Point - All routes handled by React Router (including auth routes)
// This serves the React app for ALL routes except API
Route::get('/{any?}', function () {
    return Inertia::render('app');
})->where('any', '^(?!api|settings).*$')->name('spa');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
