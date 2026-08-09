<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {
  Schema::table('bids',function(Blueprint $t){$t->foreignId('category_id')->nullable()->after('lead_id')->constrained('crm_service_categories')->nullOnDelete();$t->foreignId('site_id')->nullable()->after('client_id')->constrained('client_sites')->nullOnDelete();});
  Schema::create('bid_documents',function(Blueprint $t){$t->id();$t->foreignId('bid_id')->constrained('bids')->cascadeOnDelete();$t->string('name');$t->string('path');$t->string('original_name');$t->string('mime_type')->nullable();$t->unsignedBigInteger('size_bytes')->nullable();$t->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();$t->timestamps();});
 }
 public function down():void {Schema::dropIfExists('bid_documents');Schema::table('bids',function(Blueprint $t){$t->dropConstrainedForeignId('category_id');$t->dropConstrainedForeignId('site_id');});}
};
