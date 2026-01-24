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
        Schema::table('invoices', function (Blueprint $table) {
            $table->date('payment_date')->nullable()->after('status');
            $table->text('payment_description')->nullable()->after('payment_date');
            $table->string('receipt_number')->nullable()->after('payment_description');
            $table->string('proof_image_path')->nullable()->after('receipt_number');
            $table->timestamp('paid_at')->nullable()->after('proof_image_path');
            $table->foreignId('paid_by')->nullable()->after('paid_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['paid_by']);
            $table->dropColumn([
                'payment_date',
                'payment_description',
                'receipt_number',
                'proof_image_path',
                'paid_at',
                'paid_by'
            ]);
        });
    }
};

