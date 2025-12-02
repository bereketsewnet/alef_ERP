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
            // Drop the foreign key constraint first
            $table->dropForeign(['job_role_id']);
            
            // Make job_role_id nullable
            $table->unsignedBigInteger('job_role_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Make job_role_id NOT nullable again
            $table->unsignedBigInteger('job_role_id')->nullable(false)->change();
            
            // Re-add the foreign key constraint
            $table->foreign('job_role_id')->references('id')->on('job_roles');
        });
    }
};
