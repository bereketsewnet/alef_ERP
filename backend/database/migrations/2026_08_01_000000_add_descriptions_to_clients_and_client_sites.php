<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->text('description')->nullable()->after('company_name');
        });

        Schema::table('client_sites', function (Blueprint $table) {
            $table->text('description')->nullable()->after('site_name');
        });
    }

    public function down(): void
    {
        Schema::table('client_sites', fn (Blueprint $table) => $table->dropColumn('description'));
        Schema::table('clients', fn (Blueprint $table) => $table->dropColumn('description'));
    }
};
