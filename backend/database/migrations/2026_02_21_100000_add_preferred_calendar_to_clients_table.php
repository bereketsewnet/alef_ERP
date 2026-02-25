<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Preferred calendar for billing: EC (Ethiopian) or GC (Gregorian). Used on Billing & Invoices page only.
     */
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->string('preferred_calendar', 2)->default('GC')->after('billing_cycle'); // 'EC' or 'GC'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('preferred_calendar');
        });
    }
};
