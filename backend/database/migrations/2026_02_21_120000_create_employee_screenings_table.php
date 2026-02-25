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
        Schema::create('employee_screenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            // Screening category: security, cleaning, driving, loading_unloading, nursing, general_service
            $table->string('category');
            $table->date('screening_date')->nullable();
            $table->boolean('interview_passed')->nullable();
            $table->boolean('written_exam_required')->default(false);
            $table->integer('written_score')->nullable();
            $table->boolean('written_passed')->nullable();
            $table->boolean('practical_exam_required')->default(false);
            $table->integer('practical_score')->nullable();
            $table->boolean('practical_passed')->nullable();
            // Overall result of this screening
            $table->boolean('overall_passed')->nullable();
            // For drivers (and optionally nurses) practical exam vehicle rental cost and split
            $table->decimal('vehicle_rental_cost', 10, 2)->nullable();
            $table->decimal('vehicle_rental_paid_by_candidate', 10, 2)->nullable();
            $table->decimal('vehicle_rental_paid_by_company', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_screenings');
    }
};

