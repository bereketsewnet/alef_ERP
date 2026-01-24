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
        Schema::table('operational_reports', function (Blueprint $table) {
            $table->string('reported_by_name')->nullable()->after('reported_by_employee_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('operational_reports', function (Blueprint $table) {
            $table->dropColumn('reported_by_name');
        });
    }
};

