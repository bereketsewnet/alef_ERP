<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_assignments', function (Blueprint $table) {
            $table->string('assignment_document_path')->nullable()->after('notes');
            $table->string('assignment_condition_image_path')->nullable()->after('assignment_document_path');
            $table->string('return_document_path')->nullable()->after('assignment_condition_image_path');
            $table->string('return_condition_image_path')->nullable()->after('return_document_path');
        });
    }

    public function down(): void
    {
        Schema::table('asset_assignments', function (Blueprint $table) {
            $table->dropColumn([
                'assignment_document_path',
                'assignment_condition_image_path',
                'return_document_path',
                'return_condition_image_path',
            ]);
        });
    }
};
