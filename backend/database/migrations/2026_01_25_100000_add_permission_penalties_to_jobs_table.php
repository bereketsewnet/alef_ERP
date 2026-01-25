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
        Schema::table('jobs', function (Blueprint $table) {
            $table->decimal('permission_late_penalty', 10, 2)->default(0)->after('late_penalty');
            $table->decimal('permission_absent_penalty', 10, 2)->default(0)->after('absent_penalty');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->dropColumn(['permission_late_penalty', 'permission_absent_penalty']);
        });
    }
};

