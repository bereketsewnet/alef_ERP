<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Job;
use App\Models\JobCategory;

class JobSeeder extends Seeder
{
    public function run(): void
    {
        $securityCategory = JobCategory::where('code', 'SEC')->first();
        $cleaningCategory = JobCategory::where('code', 'CLN')->first();
        $hospitalityCategory = JobCategory::where('code', 'HSP')->first();
        $constructionCategory = JobCategory::where('code', 'CST')->first();

        $jobs = [];

        if ($securityCategory) {
            $jobs = array_merge($jobs, [
                [
                    'category_id' => $securityCategory->id,
                    'job_name' => 'Day Shift Security Guard',
                    'description' => 'Security guard for day shift (8 AM - 4 PM)',
                    'pay_type' => 'MONTHLY',
                    'base_salary' => 3500.00,
                    'hourly_rate' => 0,
                    'overtime_multiplier' => 1.5,
                    'tax_percent' => 10.0,
                    'late_penalty' => 50.00,
                    'absent_penalty' => 200.00,
                    'agency_fee_percent' => 15.0,
                    'is_active' => true,
                ],
                [
                    'category_id' => $securityCategory->id,
                    'job_name' => 'Night Shift Security Guard',
                    'description' => 'Security guard for night shift (8 PM - 4 AM)',
                    'pay_type' => 'MONTHLY',
                    'base_salary' => 4000.00,
                    'hourly_rate' => 0,
                    'overtime_multiplier' => 1.5,
                    'tax_percent' => 10.0,
                    'late_penalty' => 50.00,
                    'absent_penalty' => 200.00,
                    'agency_fee_percent' => 15.0,
                    'is_active' => true,
                ],
                [
                    'category_id' => $securityCategory->id,
                    'job_name' => 'Security Supervisor',
                    'description' => 'Supervisor for security team',
                    'pay_type' => 'MONTHLY',
                    'base_salary' => 5000.00,
                    'hourly_rate' => 0,
                    'overtime_multiplier' => 1.5,
                    'tax_percent' => 10.0,
                    'late_penalty' => 75.00,
                    'absent_penalty' => 300.00,
                    'agency_fee_percent' => 15.0,
                    'is_active' => true,
                ],
            ]);
        }

        if ($cleaningCategory) {
            $jobs = array_merge($jobs, [
                [
                    'category_id' => $cleaningCategory->id,
                    'job_name' => 'Office Cleaner',
                    'description' => 'General office cleaning and maintenance',
                    'pay_type' => 'MONTHLY',
                    'base_salary' => 2500.00,
                    'hourly_rate' => 0,
                    'overtime_multiplier' => 1.5,
                    'tax_percent' => 10.0,
                    'late_penalty' => 30.00,
                    'absent_penalty' => 150.00,
                    'agency_fee_percent' => 15.0,
                    'is_active' => true,
                ],
                [
                    'category_id' => $cleaningCategory->id,
                    'job_name' => 'Deep Clean Specialist',
                    'description' => 'Specialized deep cleaning services',
                    'pay_type' => 'HOURLY',
                    'base_salary' => 0,
                    'hourly_rate' => 45.00,
                    'overtime_multiplier' => 1.5,
                    'tax_percent' => 10.0,
                    'late_penalty' => 40.00,
                    'absent_penalty' => 180.00,
                    'agency_fee_percent' => 15.0,
                    'is_active' => true,
                ],
            ]);
        }

        if ($hospitalityCategory) {
            $jobs = array_merge($jobs, [
                [
                    'category_id' => $hospitalityCategory->id,
                    'job_name' => 'Waiter/Waitress',
                    'description' => 'Restaurant service staff',
                    'pay_type' => 'HOURLY',
                    'base_salary' => 0,
                    'hourly_rate' => 35.00,
                    'overtime_multiplier' => 1.5,
                    'tax_percent' => 10.0,
                    'late_penalty' => 25.00,
                    'absent_penalty' => 120.00,
                    'agency_fee_percent' => 15.0,
                    'is_active' => true,
                ],
            ]);
        }

        if ($constructionCategory) {
            $jobs = array_merge($jobs, [
                [
                    'category_id' => $constructionCategory->id,
                    'job_name' => 'Construction Laborer',
                    'description' => 'General construction work',
                    'pay_type' => 'HOURLY',
                    'base_salary' => 0,
                    'hourly_rate' => 50.00,
                    'overtime_multiplier' => 2.0,
                    'tax_percent' => 10.0,
                    'late_penalty' => 50.00,
                    'absent_penalty' => 200.00,
                    'agency_fee_percent' => 15.0,
                    'is_active' => true,
                ],
            ]);
        }

        foreach ($jobs as $job) {
            Job::firstOrCreate(
                [
                    'category_id' => $job['category_id'],
                    'job_name' => $job['job_name'],
                ],
                $job
            );
        }

        echo "Created " . count($jobs) . " jobs.\n";
    }
}

