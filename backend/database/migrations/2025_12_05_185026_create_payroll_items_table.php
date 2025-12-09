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
        Schema::create('payroll_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_period_id')->constrained()->onDelete('cascade');
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            
            // Earnings
            $table->decimal('base_salary', 12, 2)->default(0);
            $table->decimal('shift_allowance', 12, 2)->default(0);
            $table->decimal('overtime_pay', 12, 2)->default(0);
            $table->decimal('taxable_income', 12, 2)->default(0);
            $table->decimal('total_gross', 12, 2)->default(0);
            
            // Deductions
            $table->decimal('income_tax', 12, 2)->default(0);
            $table->decimal('pension_contribution', 12, 2)->default(0); // Employee 7%
            $table->decimal('pension_employer_contribution', 12, 2)->default(0); // Employer 11%
            $table->decimal('penalties', 12, 2)->default(0);
            $table->decimal('asset_deductions', 12, 2)->default(0);
            $table->decimal('loan_repayments', 12, 2)->default(0);
            $table->decimal('total_deductions', 12, 2)->default(0);
            
            // Net
            $table->decimal('net_pay', 12, 2)->default(0);
            
            // Meta data
            $table->integer('worked_days')->default(0);
            $table->decimal('worked_hours', 8, 2)->default(0);
            $table->decimal('overtime_hours', 8, 2)->default(0);
            $table->integer('late_days')->default(0);
            $table->integer('absent_days')->default(0);
            
            $table->string('status')->default('DRAFT'); // DRAFT, APPROVED, PAID
            $table->timestamps();
            
            // Ensure one record per employee per period
            $table->unique(['payroll_period_id', 'employee_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_items');
    }
};
