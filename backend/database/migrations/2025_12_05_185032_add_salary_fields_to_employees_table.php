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
        Schema::table('employees', function (Blueprint $table) {
            $table->decimal('base_salary', 12, 2)->nullable()->after('status');
            $table->decimal('hourly_rate', 10, 2)->nullable()->after('base_salary');
            $table->string('payment_method')->default('BANK_TRANSFER')->after('hourly_rate'); // BANK_TRANSFER, CASH
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['base_salary', 'hourly_rate', 'payment_method']);
        });
    }
};
