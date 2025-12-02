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
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained('shift_schedules')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->timestamp('clock_in_time');
            $table->timestamp('clock_out_time')->nullable();
            $table->decimal('clock_in_lat', 10, 8);
            $table->decimal('clock_in_long', 11, 8);
            $table->boolean('is_verified')->default(false);
            $table->string('verification_method')->nullable(); // GPS, MANUAL, TELEGRAM
            $table->boolean('flagged_late')->default(false);
            $table->foreignId('verified_by_user_id')->nullable()->constrained('users');
            $table->jsonb('raw_initdata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_logs');
    }
};
