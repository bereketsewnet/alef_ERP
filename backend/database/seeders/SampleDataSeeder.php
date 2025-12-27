<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\JobRole;
use App\Models\Job;
use Illuminate\Support\Facades\Hash;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create sample employees
        $guardRole = JobRole::where('title', 'Security Guard')->first();
        $cleanerRole = JobRole::where('title', 'Cleaner')->first();

        // Create John Doe employee and user
        if ($guardRole) {
            $employee1 = Employee::firstOrCreate(
                ['employee_code' => 'EMP001'],
                [
                    'first_name' => 'John',
                    'last_name' => 'Doe',
                    'phone_number' => '+251911234567',
                    'job_role_id' => $guardRole->id,
                    'status' => 'ACTIVE',
                    'hire_date' => now()->subMonths(6),
                    'probation_end_date' => now()->subMonths(3),
                ]
            );

            // Create or update user account for employee
            User::updateOrCreate(
                ['email' => 'john.doe@alefdelta.com'],
                [
                    'employee_id' => $employee1->id,
                    'username' => 'johndoe',
                    'password' => Hash::make('password123'),
                    'role' => 'FIELD_STAFF',
                    'is_active' => true,
                ]
            );
        } else {
            // If no job roles exist, create a simple test user
            User::updateOrCreate(
                ['email' => 'john.doe@alefdelta.com'],
                [
                    'username' => 'johndoe',
                    'password' => Hash::make('password123'),
                    'role' => 'FIELD_STAFF',
                    'is_active' => true,
                ]
            );
        }

        // Create Jane Smith employee and user
        if ($cleanerRole) {
            $employee2 = Employee::firstOrCreate(
                ['employee_code' => 'EMP002'],
                [
                    'first_name' => 'Jane',
                    'last_name' => 'Smith',
                    'phone_number' => '+251922345678',
                    'job_role_id' => $cleanerRole->id,
                    'status' => 'ACTIVE',
                    'hire_date' => now()->subMonths(4),
                    'probation_end_date' => now()->subMonth(),
                ]
            );

            User::updateOrCreate(
                ['email' => 'jane.smith@alefdelta.com'],
                [
                    'employee_id' => $employee2->id,
                    'username' => 'janesmith',
                    'password' => Hash::make('password123'),
                    'role' => 'FIELD_STAFF',
                    'is_active' => true,
                ]
            );
        } else {
            // If no job roles exist, create a simple test user
            User::updateOrCreate(
                ['email' => 'jane.smith@alefdelta.com'],
                [
                    'username' => 'janesmith',
                    'password' => Hash::make('password123'),
                    'role' => 'FIELD_STAFF',
                    'is_active' => true,
                ]
            );
        }
        
        // Create additional employees
        $this->createAdditionalEmployees();
        
        // Assign employees to jobs
        $this->assignEmployeesToJobs();
        
        echo "Created/Updated sample employee accounts:\n";
        echo "  - johndoe / john.doe@alefdelta.com / password123\n";
        echo "  - janesmith / jane.smith@alefdelta.com / password123\n";
    }

    private function createAdditionalEmployees(): void
    {
        $guardRole = JobRole::where('title', 'Security Guard')->first();
        $cleanerRole = JobRole::where('title', 'Cleaner')->first();

        $additionalEmployees = [
            [
                'employee_code' => 'EMP003',
                'first_name' => 'Michael',
                'last_name' => 'Tesfaye',
                'phone_number' => '+251933456789',
                'job_role_id' => $guardRole?->id,
                'username' => 'michaelt',
                'email' => 'michael.tesfaye@alefdelta.com',
            ],
            [
                'employee_code' => 'EMP004',
                'first_name' => 'Sara',
                'last_name' => 'Hailu',
                'phone_number' => '+251944567890',
                'job_role_id' => $cleanerRole?->id,
                'username' => 'sarah',
                'email' => 'sara.hailu@alefdelta.com',
            ],
            [
                'employee_code' => 'EMP005',
                'first_name' => 'Daniel',
                'last_name' => 'Kebede',
                'phone_number' => '+251955678901',
                'job_role_id' => $guardRole?->id,
                'username' => 'danielk',
                'email' => 'daniel.kebede@alefdelta.com',
            ],
        ];

        foreach ($additionalEmployees as $empData) {
            if (!$empData['job_role_id']) {
                continue;
            }

            $employee = Employee::firstOrCreate(
                ['employee_code' => $empData['employee_code']],
                [
                    'first_name' => $empData['first_name'],
                    'last_name' => $empData['last_name'],
                    'phone_number' => $empData['phone_number'],
                    'job_role_id' => $empData['job_role_id'],
                    'status' => 'ACTIVE',
                    'hire_date' => now()->subMonths(rand(1, 12)),
                    'probation_end_date' => now()->subMonths(rand(0, 3)),
                ]
            );

            User::updateOrCreate(
                ['email' => $empData['email']],
                [
                    'employee_id' => $employee->id,
                    'username' => $empData['username'],
                    'password' => Hash::make('password123'),
                    'role' => 'FIELD_STAFF',
                    'is_active' => true,
                ]
            );
        }
    }

    private function assignEmployeesToJobs(): void
    {
        $employees = Employee::all();
        $dayShiftGuard = Job::where('job_name', 'Day Shift Security Guard')->first();
        $nightShiftGuard = Job::where('job_name', 'Night Shift Security Guard')->first();
        $cleaner = Job::where('job_name', 'Office Cleaner')->first();

        foreach ($employees as $employee) {
            if (!$employee->jobRole) {
                continue;
            }

            $job = null;
            if (str_contains($employee->jobRole->title, 'Security') || str_contains($employee->jobRole->title, 'Guard')) {
                // Assign to both day and night shift (can work either)
                if ($dayShiftGuard) {
                    $employee->jobs()->syncWithoutDetaching([$dayShiftGuard->id => ['is_primary' => true]]);
                }
                if ($nightShiftGuard) {
                    $employee->jobs()->syncWithoutDetaching([$nightShiftGuard->id => ['is_primary' => false]]);
                }
            } elseif (str_contains($employee->jobRole->title, 'Cleaner')) {
                if ($cleaner) {
                    $employee->jobs()->syncWithoutDetaching([$cleaner->id => ['is_primary' => true]]);
                }
            }
        }
    }
}
