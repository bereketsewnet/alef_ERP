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
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->decimal('basic_salary', 10, 2);
            $table->decimal('total_hours_worked', 10, 2);
            $table->decimal('overtime_hours', 10, 2)->default(0);
            $table->decimal('overtime_amount', 10, 2)->default(0);
            $table->decimal('transport_allowance', 10, 2)->default(0);
            $table->decimal('taxable_income', 10, 2);
            $table->decimal('income_tax', 10, 2);
            $table->decimal('pension_7_percent', 10, 2);
            $table->decimal('cost_sharing', 10, 2)->default(0);
            $table->decimal('penalty_deductions', 10, 2)->default(0);
            $table->decimal('loan_repayment', 10, 2)->default(0);
            $table->decimal('net_pay', 10, 2);
            $table->string('status')->default('PENDING'); // PENDING, PAID
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payslips');
    }
};
