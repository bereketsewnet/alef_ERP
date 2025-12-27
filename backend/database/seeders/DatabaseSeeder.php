<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // Core data (roles, departments, admin accounts)
            RolePermissionSeeder::class,
            DepartmentSeeder::class,
            AdminSeeder::class,
            
            // Job categories and jobs
            JobCategorySeeder::class,
            JobSeeder::class,
            
            // Employee data (needs departments and job roles)
            SampleDataSeeder::class,
            
            // Clients and sites
            ClientSeeder::class,
            ClientSiteSeeder::class,
            
            // Assets
            AssetSeeder::class,
            
            // Shift schedules (needs employees, sites, jobs)
            ShiftScheduleSeeder::class,
            
            // Attendance logs (needs schedules)
            AttendanceSeeder::class,
        ]);
    }
}
