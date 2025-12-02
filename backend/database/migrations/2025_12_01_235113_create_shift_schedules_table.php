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
        Schema::create('shift_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('site_id')->constrained('client_sites')->cascadeOnDelete();
            $table->timestamp('shift_start');
            $table->timestamp('shift_end');
            $table->boolean('is_overtime_shift')->default(false);
            $table->string('status')->default('SCHEDULED'); // SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
            $table->foreignId('created_by_user_id')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_schedules');
    }
};
