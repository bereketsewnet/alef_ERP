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
        Schema::create('employee_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            // e.g. MEDICAL_PAPER, POLICE_REPORT, GUARANTOR_ID, EMPLOYEE_PHOTO, GUARANTOR_PHOTO, OTHER
            $table->string('type');
            // Simple human-friendly name/description of the document
            $table->string('name');
            // Stored file path (relative to storage)
            $table->string('file_path');
            // Some documents expire and need periodic updates
            $table->date('valid_until')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_documents');
    }
};

