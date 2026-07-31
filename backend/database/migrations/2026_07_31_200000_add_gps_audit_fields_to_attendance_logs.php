<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('attendance_logs', function (Blueprint $table) {
            $table->decimal('clock_in_accuracy', 10, 2)->nullable();
            $table->decimal('clock_in_distance', 10, 2)->nullable();
            $table->decimal('clock_out_lat', 10, 7)->nullable();
            $table->decimal('clock_out_long', 10, 7)->nullable();
            $table->decimal('clock_out_accuracy', 10, 2)->nullable();
            $table->decimal('clock_out_distance', 10, 2)->nullable();
            $table->boolean('clock_out_verified')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('attendance_logs', function (Blueprint $table) {
            $table->dropColumn([
                'clock_in_accuracy', 'clock_in_distance', 'clock_out_lat', 'clock_out_long',
                'clock_out_accuracy', 'clock_out_distance', 'clock_out_verified',
            ]);
        });
    }
};
