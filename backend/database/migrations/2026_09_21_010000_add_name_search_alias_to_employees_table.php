<?php

use App\Support\EmployeeNameSearch;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('name_search_alias', 1000)->nullable()->after('last_name');
        });

        DB::table('employees')
            ->select(['id', 'first_name', 'last_name'])
            ->orderBy('id')
            ->chunkById(200, function ($employees) {
                foreach ($employees as $employee) {
                    DB::table('employees')
                        ->where('id', $employee->id)
                        ->update([
                            'name_search_alias' => EmployeeNameSearch::aliases(
                                $employee->first_name,
                                $employee->last_name
                            ),
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('name_search_alias');
        });
    }
};
