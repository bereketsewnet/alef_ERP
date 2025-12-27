<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AttendanceLog;
use App\Models\ShiftSchedule;
use App\Models\Employee;
use App\Models\User;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $schedules = ShiftSchedule::with('employee', 'site')->get();
        
        if ($schedules->isEmpty()) {
            echo "No shift schedules found. Skipping attendance logs.\n";
            return;
        }

        $admin = User::where('username', 'admin')->first();
        $attendanceLogs = [];

        foreach ($schedules as $schedule) {
            // Only create attendance for past schedules (not future ones)
            if ($schedule->shift_start->isFuture()) {
                continue;
            }

            $site = $schedule->site;
            $employee = $schedule->employee;

            if (!$site || !$employee) {
                continue;
            }

            // Clock in time (slightly after shift start, or on time)
            $clockInTime = $schedule->shift_start->copy();
            $isLate = rand(1, 10) > 7; // 30% chance of being late
            if ($isLate) {
                $clockInTime->addMinutes(rand(5, 30)); // 5-30 minutes late
            }

            // Clock out time (at shift end, or slightly before/after)
            $clockOutTime = $schedule->shift_end->copy();
            $overtime = rand(1, 10) > 8; // 20% chance of overtime
            if ($overtime && $schedule->shift_end->isPast()) {
                $clockOutTime->addMinutes(rand(15, 60)); // 15-60 minutes overtime
            } else {
                $clockOutTime->subMinutes(rand(0, 10)); // May leave slightly early
            }

            // Use site coordinates with small random offset for realism
            $clockInLat = $site->latitude + (rand(-50, 50) / 100000); // ~50m offset
            $clockInLong = $site->longitude + (rand(-50, 50) / 100000);

            // Verify if clock in is within site radius
            $distance = $this->calculateDistance(
                $site->latitude,
                $site->longitude,
                $clockInLat,
                $clockInLong
            );
            $isVerified = $distance <= ($site->geo_radius_meters / 1000); // Convert to km

            $attendanceLogs[] = [
                'schedule_id' => $schedule->id,
                'employee_id' => $employee->id,
                'clock_in_time' => $clockInTime,
                'clock_out_time' => $clockOutTime->isPast() ? $clockOutTime : null,
                'clock_in_lat' => $clockInLat,
                'clock_in_long' => $clockInLong,
                'is_verified' => $isVerified,
                'verification_method' => $isVerified ? 'GPS' : 'MANUAL',
                'flagged_late' => $isLate,
                'verified_by_user_id' => $isVerified ? null : $admin?->id,
                'created_at' => $clockInTime,
                'updated_at' => now(),
            ];
        }

        foreach ($attendanceLogs as $log) {
            AttendanceLog::create($log);
        }

        echo "Created " . count($attendanceLogs) . " attendance logs.\n";
    }

    /**
     * Calculate distance between two coordinates in kilometers (Haversine formula)
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}

