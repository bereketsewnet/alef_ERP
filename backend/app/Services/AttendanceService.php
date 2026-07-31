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
    public function clockIn(int $employeeId, int $scheduleId, float $latitude, float $longitude, ?array $rawInitData = null, ?float $accuracy = null, ?string $photoUrl = null): array
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

        // Check if already clocked in (only verified clock-ins count)
        $existing = AttendanceLog::where('schedule_id', $scheduleId)
            ->where('employee_id', $employeeId)
            ->whereNotNull('clock_in_time')
            ->where('is_verified', true)
            ->whereNull('clock_out_time')
            ->first();

        if ($existing) {
            return ['success' => false, 'message' => 'Already clocked in for this shift', 'attendance' => $existing];
        }

        // Check if there's an unverified clock-in (from previous failed attempt)
        $unverified = AttendanceLog::where('schedule_id', $scheduleId)
            ->where('employee_id', $employeeId)
            ->whereNotNull('clock_in_time')
            ->where('is_verified', false)
            ->whereNull('clock_out_time')
            ->first();

        // Validate GPS
        $gpsValidation = $this->gpsService->isWithinRadius($latitude, $longitude, $schedule->site);

        if (!$gpsValidation['withinRadius']) {
            // If there's an unverified attempt, update it instead of creating a new one
            if ($unverified) {
                $unverified->update([
                    'clock_in_time' => now(),
                    'clock_in_lat' => $latitude,
                    'clock_in_long' => $longitude,
                    'clock_in_accuracy' => $accuracy,
                    'clock_in_distance' => $gpsValidation['distanceMeters'],
                    'clock_in_photo_url' => $photoUrl,
                ]);
            } else {
                // Log the attempt for audit purposes (only if no previous unverified attempt)
                AttendanceLog::create([
                    'schedule_id' => $scheduleId,
                    'employee_id' => $employeeId,
                    'clock_in_time' => now(),
                    'clock_in_lat' => $latitude,
                    'clock_in_long' => $longitude,
                    'clock_in_accuracy' => $accuracy,
                    'clock_in_distance' => $gpsValidation['distanceMeters'],
                    'clock_in_photo_url' => $photoUrl,
                    'is_verified' => false,
                    'verification_method' => 'GPS',
                    'flagged_late' => false,
                    'raw_initdata' => $rawInitData ? json_encode($rawInitData) : null,
                ]);
            }

            return [
                'success' => false,
                'message' => 'Location verification failed. You are ' . round($gpsValidation['distanceMeters']) . ' meters from the site (allowed: ' . $schedule->site->geo_radius_meters . ' meters). Please move closer to the site location.',
                'attendance' => null,
                'distance' => $gpsValidation['distanceMeters'],
            ];
        }

        // If GPS is valid and there's an unverified attempt, update it to verified
        if ($unverified) {
            $shiftStart = Carbon::parse($schedule->shift_start);
            $now = now();
            $flaggedLate = $now->gt($shiftStart->copy()->addMinutes(30));

            $unverified->update([
                'clock_in_time' => $now,
                'clock_in_lat' => $latitude,
                'clock_in_long' => $longitude,
                'clock_in_accuracy' => $accuracy,
                'clock_in_distance' => $gpsValidation['distanceMeters'],
                'clock_in_photo_url' => $photoUrl,
                'is_verified' => true,
                'flagged_late' => $flaggedLate,
            ]);

            return [
                'success' => true,
                'message' => 'Clocked in successfully!',
                'attendance' => $unverified->fresh(),
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
            'clock_in_accuracy' => $accuracy,
            'clock_in_distance' => $gpsValidation['distanceMeters'],
            'clock_in_photo_url' => $photoUrl,
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
    public function clockOut(int $employeeId, int $scheduleId, float $latitude, float $longitude, ?float $accuracy = null, ?string $photoUrl = null): array
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

        $schedule = ShiftSchedule::with('site')->find($scheduleId);
        $gpsValidation = $this->gpsService->isWithinRadius($latitude, $longitude, $schedule->site);
        if (!$gpsValidation['withinRadius']) {
            return [
                'success' => false,
                'message' => 'Location verification failed. You are ' . round($gpsValidation['distanceMeters']) . ' meters from the site.',
                'attendance' => $attendance,
                'distance' => $gpsValidation['distanceMeters'],
            ];
        }

        $attendance->update([
            'clock_out_time' => now(),
            'clock_out_lat' => $latitude,
            'clock_out_long' => $longitude,
            'clock_out_accuracy' => $accuracy,
            'clock_out_distance' => $gpsValidation['distanceMeters'],
            'clock_out_verified' => true,
            'clock_out_photo_url' => $photoUrl,
        ]);

        // Update schedule status
        ShiftSchedule::find($scheduleId)->update(['status' => 'COMPLETED']);

        return [
            'success' => true,
            'message' => 'Clocked out successfully',
            'attendance' => $attendance->fresh(),
            'distance' => $gpsValidation['distanceMeters'],
        ];
    }
}
