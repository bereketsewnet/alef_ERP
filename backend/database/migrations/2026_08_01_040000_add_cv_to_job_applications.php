<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->string('cv_path')->nullable()->after('email');
            $table->string('cv_original_name')->nullable()->after('cv_path');
            $table->string('cv_mime_type', 150)->nullable()->after('cv_original_name');
            $table->unsignedBigInteger('cv_size_bytes')->nullable()->after('cv_mime_type');
        });
    }

    public function down(): void
    {
        Schema::table('job_applications', fn (Blueprint $table) => $table->dropColumn([
            'cv_path', 'cv_original_name', 'cv_mime_type', 'cv_size_bytes',
        ]));
    }
};
