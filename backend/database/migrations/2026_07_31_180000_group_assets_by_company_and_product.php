<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('assets')->orderBy('id')->chunkById(200, function ($assets) {
            foreach ($assets as $asset) {
                $identity = ($asset->client_id ?? 'no-company')
                    . '|' . mb_strtolower(trim($asset->name))
                    . '|' . mb_strtoupper(trim($asset->category));
                $hash = md5($identity);
                $groupId = substr($hash, 0, 8) . '-'
                    . substr($hash, 8, 4) . '-'
                    . substr($hash, 12, 4) . '-'
                    . substr($hash, 16, 4) . '-'
                    . substr($hash, 20, 12);

                DB::table('assets')->where('id', $asset->id)->update([
                    'batch_id' => $groupId,
                    'batch_name' => $asset->name,
                ]);
            }
        });
    }

    public function down(): void
    {
        DB::table('assets')->update(['batch_id' => null, 'batch_name' => null]);
    }
};
