<?php

use App\Support\EthiopianPhoneNumber;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['employees', 'users'] as $table) {
            DB::table($table)
                ->select(['id', 'phone_number'])
                ->whereNotNull('phone_number')
                ->orderBy('id')
                ->chunkById(200, function ($records) use ($table) {
                    foreach ($records as $record) {
                        $normalized = EthiopianPhoneNumber::normalize($record->phone_number);

                        if ($normalized !== $record->phone_number) {
                            DB::table($table)
                                ->where('id', $record->id)
                                ->update(['phone_number' => $normalized]);
                        }
                    }
                });
        }
    }

    public function down(): void
    {
        // Intentionally irreversible: the country code is the canonical form.
    }
};
