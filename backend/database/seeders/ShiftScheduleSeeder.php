<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ShiftSchedule;
use App\Models\Employee;
use App\Models\ClientSite;
use App\Models\Job;
use App\Models\User;

class ShiftScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $employees = Employee::with('user')->get();
        $sites = ClientSite::all();
        $dayShiftGuard = Job::where('job_name', 'Day Shift Security Guard')->first();
        $nightShiftGuard = Job::where('job_name', 'Night Shift Security Guard')->first();
        $cleaner = Job::where('job_name', 'Office Cleaner')->first();
        $admin = User::where('username', 'admin')->first();

        if ($employees->isEmpty() || $sites->isEmpty()) {
            echo "No employees or sites found. Skipping shift schedules.\n";
            return;
        }

        $schedules = [];
        $now = now();
        
        // Create schedules for the past 7 days
        for ($day = 6; $day >= 0; $day--) {
            $date = $now->copy()->subDays($day);
            
            foreach ($employees->take(5) as $index => $employee) {
                $site = $sites->random();
                $job = null;
                
                // Assign job based on employee's job role
                if ($employee->jobRole) {
                    if (str_contains($employee->jobRole->title, 'Security') || str_contains($employee->jobRole->title, 'Guard')) {
                        $job = ($index % 2 == 0) ? $dayShiftGuard : $nightShiftGuard;
                    } elseif (str_contains($employee->jobRole->title, 'Cleaner')) {
                        $job = $cleaner;
                    }
                }
                
                // Default to day shift guard if no job found
                if (!$job) {
                    $job = $dayShiftGuard;
                }
                
                if (!$job) {
                    continue;
                }

                // Day shift: 8 AM - 4 PM
                if ($job->id == $dayShiftGuard?->id) {
                    $shiftStart = $date->copy()->setTime(8, 0);
                    $shiftEnd = $date->copy()->setTime(16, 0);
                }
                // Night shift: 8 PM - 4 AM (next day)
                elseif ($job->id == $nightShiftGuard?->id) {
                    $shiftStart = $date->copy()->setTime(20, 0);
                    $shiftEnd = $date->copy()->addDay()->setTime(4, 0);
                }
                // Cleaner: 6 AM - 2 PM
                else {
                    $shiftStart = $date->copy()->setTime(6, 0);
                    $shiftEnd = $date->copy()->setTime(14, 0);
                }

                $schedules[] = [
                    'employee_id' => $employee->id,
                    'site_id' => $site->id,
                    'job_id' => $job->id,
                    'shift_start' => $shiftStart,
                    'shift_end' => $shiftEnd,
                    'is_overtime_shift' => false,
                    'status' => 'SCHEDULED',
                    'created_by_user_id' => $admin?->id,
                ];
            }
        }

        foreach ($schedules as $schedule) {
            ShiftSchedule::create($schedule);
        }

        echo "Created " . count($schedules) . " shift schedules.\n";
    }
}

