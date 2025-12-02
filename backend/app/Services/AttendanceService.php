<?php

namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\ShiftSchedule;
use App\Models\ClientSite;
use Carbon\Carbon;

/**
 * Attendance Service
 * 
 * Manages employee attendance, clock-in/out, and GPS verification
 */
class AttendanceService
{
    private GpsValidationService $gpsService;

    public function __construct(GpsValidationService $gpsService)
    {
        $this->gpsService = $gpsService;
    }

    /**
     * Process clock-in for an employee
     *
     * @param int $employeeId
     * @param int $scheduleId
     * @param float $latitude
     * @param float $longitude
     * @param array|null $rawInitData Optional Telegram initData for audit
     * @return array ['success' => bool, 'message' => string, 'attendance' => AttendanceLog|null]
     */
    public function clockIn(int $employeeId, int $scheduleId, float $latitude, float $longitude, ?array $rawInitData = null): array
    {
        // Find the schedule
        $schedule = ShiftSchedule::with('site')->find($scheduleId);

        if (!$schedule) {
            return ['success' => false, 'message' => 'Schedule not found', 'attendance' => null];
        }

        // Verify employee
        if ($schedule->employee_id !== $employeeId) {
            return ['success' => false, 'message' => 'Schedule does not belong to this employee', 'attendance' => null];
        }

        // Check if already clocked in
        $existing = AttendanceLog::where('schedule_id', $scheduleId)
            ->where('employee_id', $employeeId)
            ->whereNotNull('clock_in_time')
            ->first();

        if ($existing) {
            return ['success' => false, 'message' => 'Already clocked in for this shift', 'attendance' => null];
        }

        // Validate GPS
        $gpsValidation = $this->gpsService->isWithinRadius($latitude, $longitude, $schedule->site);

        if (!$gpsValidation['withinRadius']) {
            // Log the attempt anyway for audit purposes
            AttendanceLog::create([
                'schedule_id' => $scheduleId,
                'employee_id' => $employeeId,
                'clock_in_time' => now(),
                'clock_in_lat' => $latitude,
                'clock_in_long' => $longitude,
                'is_verified' => false,
                'verification_method' => 'GPS',
                'flagged_late' => false,
                'raw_initdata' => $rawInitData ? json_encode($rawInitData) : null,
            ]);

            return [
                'success' => false,
                'message' => 'Location verification failed. You are ' . round($gpsValidation['distanceMeters']) . ' meters from the site (allowed: ' . $schedule->site->geo_radius_meters . ' meters)',
                'attendance' => null,
                'distance' => $gpsValidation['distanceMeters'],
            ];
        }

        // Check punctuality - allow 15 minutes early and 30 minutes late
        $shiftStart = Carbon::parse($schedule->shift_start);
        $now = now();
        $flaggedLate = $now->gt($shiftStart->addMinutes(30));

        // Create attendance log
        $attendance = AttendanceLog::create([
            'schedule_id' => $scheduleId,
            'employee_id' => $employeeId,
            'clock_in_time' => $now,
            'clock_in_lat' => $latitude,
            'clock_in_long' => $longitude,
            'is_verified' => true,
            'verification_method' => 'GPS',
            'flagged_late' => $flaggedLate,
            'raw_initdata' => $rawInitData ? json_encode($rawInitData) : null,
        ]);

        return [
            'success' => true,
            'message' => $flaggedLate ? 'Clocked in successfully (marked as late)' : 'Clocked in successfully',
            'attendance' => $attendance,
            'distance' => $gpsValidation['distanceMeters'],
        ];
    }

    /**
     * Process clock-out for an employee
     *
     * @param int $employeeId
     * @param int $scheduleId
     * @param float $latitude
     * @param float $longitude
     * @return array ['success' => bool, 'message' => string, 'attendance' => AttendanceLog|null]
     */
    public function clockOut(int $employeeId, int $scheduleId, float $latitude, float $longitude): array
    {
        // Find the attendance log
        $attendance = AttendanceLog::where('schedule_id', $scheduleId)
            ->where('employee_id', $employeeId)
            ->whereNotNull('clock_in_time')
            ->whereNull('clock_out_time')
            ->first();

        if (!$attendance) {
            return ['success' => false, 'message' => 'No active clock-in found for this shift', 'attendance' => null];
        }

        // Update clock-out
        $attendance->update([
            'clock_out_time' => now(),
        ]);

        // Update schedule status
        ShiftSchedule::find($scheduleId)->update(['status' => 'COMPLETED']);

        return [
            'success' => true,
            'message' => 'Clocked out successfully',
            'attendance' => $attendance->fresh(),
        ];
    }
}
