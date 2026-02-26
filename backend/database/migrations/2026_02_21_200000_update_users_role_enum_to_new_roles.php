<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * New roles: Owner (Super Admin), GM, HR, Finance, Operations, Marketing, Procurement, Field Staff.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            // MySQL: change to varchar first so we can set any value, then to new enum
            DB::statement("ALTER TABLE users MODIFY COLUMN role VARCHAR(32) NOT NULL DEFAULT 'FIELD_STAFF'");
        }

        // Map old roles to new
        $maps = [
            'SUPER_ADMIN' => 'OWNER',
            'HR_MANAGER' => 'HR',
            'OPS_MANAGER' => 'OPERATIONS',
            'SITE_SUPERVISOR' => 'OPERATIONS',
            'FINANCE' => 'FINANCE',
            'FIELD_STAFF' => 'FIELD_STAFF',
        ];
        foreach ($maps as $old => $new) {
            DB::table('users')->where('role', $old)->update(['role' => $new]);
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('OWNER','GM','HR','FINANCE','OPERATIONS','MARKETING','PROCUREMENT','FIELD_STAFF') NOT NULL DEFAULT 'FIELD_STAFF'");
        } else {
            Schema::table('users', function ($table) {
                $table->string('role', 50)->default('FIELD_STAFF')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role VARCHAR(32) NOT NULL DEFAULT 'FIELD_STAFF'");
        }
        $maps = [
            'OWNER' => 'SUPER_ADMIN',
            'GM' => 'SUPER_ADMIN',
            'HR' => 'HR_MANAGER',
            'OPERATIONS' => 'OPS_MANAGER',
            'MARKETING' => 'OPS_MANAGER',
            'PROCUREMENT' => 'OPS_MANAGER',
            'FINANCE' => 'FINANCE',
            'FIELD_STAFF' => 'FIELD_STAFF',
        ];
        foreach ($maps as $new => $old) {
            DB::table('users')->where('role', $new)->update(['role' => $old]);
        }
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('SUPER_ADMIN','OPS_MANAGER','HR_MANAGER','FINANCE','SITE_SUPERVISOR','FIELD_STAFF') NOT NULL DEFAULT 'FIELD_STAFF'");
        }
    }
};
