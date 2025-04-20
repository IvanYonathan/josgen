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

    Route::get('division', function () {
        return Inertia::render('division');
    })->name('division');

    Route::get('toDoList', function () {
        return Inertia::render('toDoList');
    })->name('toDoList');

    Route::get('event', function () {
        return Inertia::render('event');
    })->name('event');

    Route::get('project', function () {
        return Inertia::render('project');
    })->name('project');

    Route::get('treasury', function () {
        return Inertia::render('treasury');
    })->name('treasury');

    Route::get('note', function () {
        return Inertia::render('note');
    })->name('note');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
