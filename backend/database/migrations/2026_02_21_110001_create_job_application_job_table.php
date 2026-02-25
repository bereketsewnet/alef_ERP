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
        Schema::create('job_application_job', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_application_id')
                ->constrained('job_applications')
                ->onDelete('cascade');
            $table->foreignId('job_id')
                ->constrained('jobs')
                ->onDelete('cascade');
            $table->timestamps();

            $table->unique(['job_application_id', 'job_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_application_job');
    }
};

