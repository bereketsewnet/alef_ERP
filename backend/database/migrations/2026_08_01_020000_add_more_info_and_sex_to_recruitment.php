<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('vacancies', fn (Blueprint $table) => $table->text('more_info')->nullable()->after('qualification'));
        Schema::table('job_applications', fn (Blueprint $table) => $table->string('sex', 10)->nullable()->after('age'));
    }

    public function down(): void
    {
        Schema::table('job_applications', fn (Blueprint $table) => $table->dropColumn('sex'));
        Schema::table('vacancies', fn (Blueprint $table) => $table->dropColumn('more_info'));
    }
};
