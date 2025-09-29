<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Division page - pure SPA, all data loaded via API
    Route::get('divisions', function () {
        return Inertia::render('division/division-page');
    })->name('divisions.index');

    Route::get('toDoList', function () {
        return Inertia::render('toDoList/index'); // Matches folder and file structure
    })->name('toDoList.index');

    Route::get('toDoList/personal/index', function () {
        return Inertia::render('toDoList/personal/index');
    })->name('toDoList.personal.index');

    Route::get('toDoList/division/index', function () {
        return Inertia::render('toDoList/division/index');
    })->name('toDoList.division.index');

    Route::get('event', function () {
        return Inertia::render('event/index'); // Matches folder and file structure
    })->name('event.index');

    Route::get('project', function () {
        return Inertia::render('project/index'); // Matches folder and file structure
    })->name('project.index');

    Route::get('treasury', function () {
        return Inertia::render('treasury/index'); // Matches folder and file structure
    })->name('treasury.index');

    Route::get('note', function () {
        return Inertia::render('note/index'); // Matches folder and file structure
    })->name('note.index');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
