<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::table('attendance_logs', function (Blueprint $table) { $table->string('clock_in_photo_url')->nullable(); $table->string('clock_out_photo_url')->nullable(); }); }
    public function down(): void { Schema::table('attendance_logs', fn (Blueprint $table) => $table->dropColumn(['clock_in_photo_url', 'clock_out_photo_url'])); }
};
