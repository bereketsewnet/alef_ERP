<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_logs', function (Blueprint $table) {
            // Make GPS coords nullable so manual entries don't need a location
            $table->decimal('clock_in_lat', 10, 8)->nullable()->change();
            $table->decimal('clock_in_long', 11, 8)->nullable()->change();

            // Manual entry tracking
            $table->boolean('manual_entry')->default(false)->after('raw_initdata');
            $table->text('manual_note')->nullable()->after('manual_entry');

            // Explicit attendance status for manual records.
            // NULL = old GPS record (treated as PRESENT for backward compatibility).
            // PRESENT | LATE | ABSENT
            // with_permission on the same row tracks "with/without permission" for LATE and ABSENT.
            $table->string('attendance_status', 20)->nullable()->after('manual_note');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_logs', function (Blueprint $table) {
            $table->decimal('clock_in_lat', 10, 8)->nullable(false)->change();
            $table->decimal('clock_in_long', 11, 8)->nullable(false)->change();
            $table->dropColumn(['manual_entry', 'manual_note', 'attendance_status']);
        });
    }
};
