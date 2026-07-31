<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->unsignedTinyInteger('payment_due_day')->nullable()->after('billing_cycle');
            $table->unsignedSmallInteger('payment_grace_days')->default(0)->after('payment_due_day');
            $table->string('late_penalty_type', 20)->nullable()->after('payment_grace_days');
            $table->decimal('late_penalty_value', 12, 2)->nullable()->after('late_penalty_type');
            $table->boolean('late_penalty_recurring')->default(false)->after('late_penalty_value');
        });
    }

    public function down(): void
    {
        Schema::table('clients', fn (Blueprint $table) => $table->dropColumn([
            'payment_due_day', 'payment_grace_days', 'late_penalty_type',
            'late_penalty_value', 'late_penalty_recurring',
        ]));
    }
};
