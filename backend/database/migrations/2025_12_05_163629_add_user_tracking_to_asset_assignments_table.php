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
        Schema::table('asset_assignments', function (Blueprint $table) {
            $table->foreignId('assigned_by_user_id')->nullable()->after('notes')->constrained('users')->nullOnDelete();
            $table->foreignId('returned_by_user_id')->nullable()->after('assigned_by_user_id')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('asset_assignments', function (Blueprint $table) {
            $table->dropForeign(['assigned_by_user_id']);
            $table->dropForeign(['returned_by_user_id']);
            $table->dropColumn(['assigned_by_user_id', 'returned_by_user_id']);
        });
    }
};
