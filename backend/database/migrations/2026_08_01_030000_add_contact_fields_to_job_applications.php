<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->string('phone_number', 50)->nullable()->after('sex');
            $table->string('email')->nullable()->after('phone_number');
        });
    }

    public function down(): void
    {
        Schema::table('job_applications', fn (Blueprint $table) => $table->dropColumn(['phone_number', 'email']));
    }
};
