<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Remove the legacy check constraint that limited user roles to the seeded enum.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
    }

    /**
     * Recreate the original constraint (for rollback scenarios only).
     */
    public function down(): void
    {
        DB::statement(
            "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('Sysadmin','Division_Leader','Treasurer','Member'))"
        );
    }
};
