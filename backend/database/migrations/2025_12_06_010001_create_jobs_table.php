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
        Schema::dropIfExists('jobs'); // Replace default Laravel jobs table if it exists as we need this name for the module
        
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('job_categories')->onDelete('cascade');
            $table->string('job_code', 20)->unique();   // Auto-generated: SEC-001, CLN-001
            $table->string('job_name');                  // "Security Guard", "Cleaner"
            $table->text('description')->nullable();
            
            // Pay Configuration
            $table->enum('pay_type', ['HOURLY', 'MONTHLY'])->default('MONTHLY');
            $table->decimal('base_salary', 12, 2)->default(0);
            $table->decimal('hourly_rate', 10, 2)->default(0);
            $table->decimal('overtime_multiplier', 4, 2)->default(1.50);
            
            // Deduction Defaults
            $table->decimal('tax_percent', 5, 2)->default(0);
            $table->decimal('late_penalty', 10, 2)->default(100);
            $table->decimal('absent_penalty', 10, 2)->default(500);
            $table->decimal('agency_fee_percent', 5, 2)->default(0);
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jobs');
    }
};
