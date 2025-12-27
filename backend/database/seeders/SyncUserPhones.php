<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;

class SyncUserPhones extends Seeder
{
    public function run(): void
    {
        echo "Syncing phone numbers from employees to users...\n";
        
        $count = 0;
        User::whereNotNull('employee_id')
            ->with('employee')
            ->get()
            ->each(function ($user) use (&$count) {
                if ($user->employee && $user->employee->phone_number) {
                    if (!$user->phone_number || $user->phone_number !== $user->employee->phone_number) {
                        $user->phone_number = $user->employee->phone_number;
                        $user->save();
                        echo "Updated {$user->username}: {$user->phone_number}\n";
                        $count++;
                    }
                }
            });
        
        echo "Synced {$count} user phone numbers.\n";
    }
}

