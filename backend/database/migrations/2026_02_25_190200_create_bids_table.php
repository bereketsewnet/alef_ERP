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
        Schema::create('bids', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('crm_leads')->nullOnDelete();
            $table->string('title');
            $table->string('reference_number')->nullable();
            $table->string('issuer')->nullable(); // who issued the bid / tender
            $table->date('submission_deadline')->nullable();
            $table->decimal('estimated_value', 12, 2)->nullable();
            $table->decimal('submitted_value', 12, 2)->nullable();
            $table->date('submitted_at')->nullable();
            $table->date('result_date')->nullable();
            $table->string('status')->default('POTENTIAL'); // POTENTIAL, APPLIED, WON, LOST, NOT_ELIGIBLE
            $table->text('notes')->nullable();
            $table->foreignId('responsible_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bids');
    }
};

