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
        Schema::create('employee_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->foreignId('job_id')->constrained()->onDelete('cascade');
            $table->boolean('is_primary')->default(false);
            
            // Overrides (nullable = use job defaults)
            $table->decimal('override_salary', 12, 2)->nullable();
            $table->decimal('override_hourly_rate', 10, 2)->nullable();
            $table->decimal('override_tax_percent', 5, 2)->nullable();
            $table->decimal('override_late_penalty', 10, 2)->nullable();
            $table->decimal('override_absent_penalty', 10, 2)->nullable();
            $table->decimal('override_agency_fee_percent', 5, 2)->nullable();
            $table->decimal('override_overtime_multiplier', 4, 2)->nullable();
            
            $table->timestamps();
            
            $table->unique(['employee_id', 'job_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_jobs');
    }
};
