<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\JobRole;
use Illuminate\Support\Facades\Hash;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create sample employees
        $guardRole = JobRole::where('title', 'Security Guard')->first();
        $cleanerRole = JobRole::where('title', 'Cleaner')->first();

        if ($guardRole) {
            $employee1 = Employee::create([
                'employee_code' => 'EMP001',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'phone_number' => '+251911234567',
                'job_role_id' => $guardRole->id,
                'status' => 'ACTIVE',
                'hire_date' => now()->subMonths(6),
                'probation_end_date' => now()->subMonths(3),
            ]);

            // Create user account for employee
            User::create([
                'employee_id' => $employee1->id,
                'username' => 'johndoe',
                'email' => 'john.doe@alefdelta.com',
                'password' => Hash::make('password123'),
                'role' => 'FIELD_STAFF',
                'is_active' => true,
            ]);
        }

        if ($cleanerRole) {
            $employee2 = Employee::create([
                'employee_code' => 'EMP002',
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'phone_number' => '+251922345678',
                'job_role_id' => $cleanerRole->id,
                'status' => 'ACTIVE',
                'hire_date' => now()->subMonths(4),
                'probation_end_date' => now()->subMonth(),
            ]);

            User::create([
                'employee_id' => $employee2->id,
                'username' => 'janesmith',
                'email' => 'jane.smith@alefdelta.com',
                'password' => Hash::make('password123'),
                'role' => 'FIELD_STAFF',
                'is_active' => true,
            ]);
        }
    }
}
