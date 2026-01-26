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
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->integer('permission_late_count')->default(0)->after('late_days');
            $table->integer('permission_absent_count')->default(0)->after('absent_days');
            $table->integer('normal_late_count')->default(0)->after('permission_late_count');
            $table->integer('normal_absent_count')->default(0)->after('permission_absent_count');
            $table->integer('expected_days')->default(0)->after('worked_days');
            $table->foreignId('client_id')->nullable()->after('employee_id')->constrained('clients')->onDelete('cascade');
        });
        
        // Add manual_penalties column if it doesn't exist (for backward compatibility)
        if (!Schema::hasColumn('payroll_items', 'manual_penalties')) {
            Schema::table('payroll_items', function (Blueprint $table) {
                $table->decimal('manual_penalties', 10, 2)->default(0)->after('penalties');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $columnsToDrop = [
                'permission_late_count',
                'permission_absent_count',
                'normal_late_count',
                'normal_absent_count',
                'expected_days',
                'client_id'
            ];
            // Only drop manual_penalties if it exists
            if (Schema::hasColumn('payroll_items', 'manual_penalties')) {
                $columnsToDrop[] = 'manual_penalties';
            }
            $table->dropColumn($columnsToDrop);
        });
    }
};


