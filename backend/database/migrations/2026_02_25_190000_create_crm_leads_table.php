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
        Schema::create('crm_leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('company_name');
            $table->string('contact_person')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('email')->nullable();
            $table->string('source')->nullable(); // e.g. Referral, LinkedIn, Website, Cold call
            $table->string('stage')->default('REACH'); // REACH, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
            $table->decimal('expected_value', 12, 2)->nullable();
            $table->unsignedTinyInteger('probability')->nullable(); // 0-100
            $table->date('next_action_date')->nullable();
            $table->text('next_action_note')->nullable();
            $table->dateTime('last_contacted_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_leads');
    }
};

