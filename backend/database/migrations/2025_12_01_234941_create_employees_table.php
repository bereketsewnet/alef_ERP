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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_code')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone_number')->index();
            $table->foreignId('job_role_id')->constrained();
            $table->string('status')->default('ACTIVE'); // ACTIVE, TERMINATED, ON_LEAVE
            $table->date('hire_date');
            $table->date('termination_date')->nullable();
            $table->jsonb('guarantor_details')->nullable();
            $table->date('police_clearance_expiry')->nullable();
            $table->date('probation_end_date')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
