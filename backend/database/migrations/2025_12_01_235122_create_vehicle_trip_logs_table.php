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
        Schema::create('vehicle_trip_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('driver_employee_id')->constrained('employees')->cascadeOnDelete();
            $table->timestamp('start_time');
            $table->timestamp('end_time')->nullable();
            $table->integer('start_km');
            $table->integer('end_km')->nullable();
            $table->string('purpose')->nullable();
            $table->decimal('fuel_added_liters', 8, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_trip_logs');
    }
};
