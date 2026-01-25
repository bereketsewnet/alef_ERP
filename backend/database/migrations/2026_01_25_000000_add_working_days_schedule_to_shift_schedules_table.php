<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('shift_schedules', function (Blueprint $table) {
            // Store working days schedule pattern used for bulk assignment
            // Format: JSON with day-specific schedules
            // Example: {"monday": {"enabled": true, "start_time": "08:00", "end_time": "17:00"}, ...}
            $table->json('working_days_schedule')->nullable()->after('shift_end');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shift_schedules', function (Blueprint $table) {
            $table->dropColumn('working_days_schedule');
        });
    }
};

