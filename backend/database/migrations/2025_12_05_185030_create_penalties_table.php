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
        Schema::create('penalties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->foreignId('payroll_period_id')->nullable()->constrained()->nullOnDelete(); // Linked when processed
            $table->string('penalty_type'); // LATE, ABSENCE, DAMAGE, OTHER
            $table->decimal('amount', 12, 2);
            $table->date('penalty_date');
            $table->text('reason')->nullable();
            $table->string('status')->default('PENDING'); // PENDING, APPLIED, CANCELLED
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('penalties');
    }
};
