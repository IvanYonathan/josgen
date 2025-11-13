<?php

namespace App\Providers;

use App\Support\PermissionSynchronizer;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        try {
            if (Schema::hasTable('permissions')) {
                PermissionSynchronizer::sync();
            }
        } catch (\Throwable $e) {
            // Tables might not exist yet (e.g., during initial migrations). Ignore gracefully.
        }
    }
}
