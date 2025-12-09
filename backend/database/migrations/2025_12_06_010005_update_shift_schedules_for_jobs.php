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
        Schema::table('shift_schedules', function (Blueprint $table) {
            // Add job_id for tracking which job this shift is for
            $table->foreignId('job_id')->nullable()->after('site_id')->constrained();
        });
        
        // Remove old columns that are now handled by job settings
        Schema::table('shift_schedules', function (Blueprint $table) {
            if (Schema::hasColumn('shift_schedules', 'pay_rate')) {
                $table->dropColumn('pay_rate');
            }
            if (Schema::hasColumn('shift_schedules', 'agency_fee_percentage')) {
                $table->dropColumn('agency_fee_percentage');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shift_schedules', function (Blueprint $table) {
            $table->dropForeign(['job_id']);
            $table->dropColumn('job_id');
            
            // Re-add old columns
            $table->decimal('pay_rate', 10, 2)->nullable();
            $table->decimal('agency_fee_percentage', 5, 2)->nullable();
        });
    }
};
