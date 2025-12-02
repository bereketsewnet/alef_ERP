<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\JobRole;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        // Create Departments
        $security = Department::create([
            'name' => 'Security',
            'description' => 'Security and guard services',
        ]);

        $cleaning = Department::create([
            'name' => 'Cleaning',
            'description' => 'Cleaning and janitorial services',
        ]);

        $transport = Department::create([
            'name' => 'Transport',
            'description' => 'Driver and transport services',
        ]);

        // Create Job Roles for Security
        JobRole::create([
            'department_id' => $security->id,
            'title' => 'Security Guard',
            'base_hourly_rate' => 50.00,
            'billing_hourly_rate' => 75.00,
            'requires_license' => false,
        ]);

        JobRole::create([
            'department_id' => $security->id,
            'title' => 'Armed Guard',
            'base_hourly_rate' => 80.00,
            'billing_hourly_rate' => 120.00,
            'requires_license' => true,
        ]);

        // Create Job Roles for Cleaning
        JobRole::create([
            'department_id' => $cleaning->id,
            'title' => 'Cleaner',
            'base_hourly_rate' => 35.00,
            'billing_hourly_rate' => 50.00,
            'requires_license' => false,
        ]);

        JobRole::create([
            'department_id' => $cleaning->id,
            'title' => 'Janitor',
            'base_hourly_rate' => 40.00,
            'billing_hourly_rate' => 60.00,
            'requires_license' => false,
        ]);

        // Create Job Roles for Transport
        JobRole::create([
            'department_id' => $transport->id,
            'title' => 'Driver',
            'base_hourly_rate' => 55.00,
            'billing_hourly_rate' => 85.00,
            'requires_license' => true,
        ]);
    }
}
