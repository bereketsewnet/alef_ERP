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
        Schema::table('employee_jobs', function (Blueprint $table) {
            $table->decimal('override_permission_late_penalty', 10, 2)->nullable()->after('override_late_penalty');
            $table->decimal('override_permission_absent_penalty', 10, 2)->nullable()->after('override_absent_penalty');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_jobs', function (Blueprint $table) {
            $table->dropColumn(['override_permission_late_penalty', 'override_permission_absent_penalty']);
        });
    }
};

