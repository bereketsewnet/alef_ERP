<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('crm_service_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        foreach (['Guard', 'Cleaner', 'Driver', 'Messenger'] as $name) {
            DB::table('crm_service_categories')->insert(['name' => $name, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        }

        Schema::table('contracts', function (Blueprint $table) {
            $table->foreignId('site_id')->nullable()->after('client_id')->constrained('client_sites')->nullOnDelete();
            $table->string('title')->nullable()->after('site_id');
            $table->string('reference_number')->nullable()->after('title');
            $table->decimal('contract_amount', 14, 2)->nullable();
            $table->string('payment_frequency')->nullable();
            $table->unsignedTinyInteger('payment_due_day')->nullable();
            $table->unsignedInteger('expiry_reminder_days')->default(30);
            $table->string('reminder_email')->nullable();
            $table->timestamp('reminder_sent_at')->nullable();
            $table->text('agreement_summary')->nullable();
            $table->text('payment_terms')->nullable();
            $table->text('termination_reason')->nullable();
            $table->timestamp('terminated_at')->nullable();
            $table->foreignId('terminated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('archived_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::create('contract_crm_service_category', function (Blueprint $table) {
            $table->foreignId('contract_id')->constrained('contracts')->cascadeOnDelete();
            $table->foreignId('crm_service_category_id')->constrained('crm_service_categories')->cascadeOnDelete();
            $table->primary(['contract_id', 'crm_service_category_id'], 'contract_crm_category_pk');
        });

        Schema::create('crm_contract_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('contracts')->cascadeOnDelete();
            $table->string('name');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('crm_customer_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('site_id')->nullable()->constrained('client_sites')->nullOnDelete();
            $table->foreignId('contract_id')->nullable()->constrained('contracts')->nullOnDelete();
            $table->string('subject');
            $table->text('description');
            $table->string('priority')->default('MEDIUM');
            $table->string('status')->default('OPEN');
            $table->text('action_taken')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_customer_issues');
        Schema::dropIfExists('crm_contract_documents');
        Schema::dropIfExists('contract_crm_service_category');
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('site_id');
            $table->dropConstrainedForeignId('terminated_by');
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn(['title','reference_number','contract_amount','payment_frequency','payment_due_day','expiry_reminder_days','reminder_email','reminder_sent_at','agreement_summary','payment_terms','termination_reason','terminated_at','archived_at']);
        });
        Schema::dropIfExists('crm_service_categories');
    }
};
