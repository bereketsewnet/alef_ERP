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
        Schema::create('operational_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('client_sites')->cascadeOnDelete();
            $table->foreignId('reported_by_employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('report_type'); // INCIDENT, ACCIDENT, OBSERVATION
            $table->text('description');
            $table->jsonb('evidence_media_urls')->nullable();
            $table->string('severity_level')->default('LOW'); // LOW, MEDIUM, HIGH, CRITICAL
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operational_reports');
    }
};
