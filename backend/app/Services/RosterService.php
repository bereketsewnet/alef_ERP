<?php

namespace App\Services;

use App\Models\ShiftSchedule;
use App\Models\Employee;
use App\Models\ClientSite;
use Illuminate\Support\Collection;
use Carbon\Carbon;

/**
 * Roster Service
 * 
 * Manages shift scheduling and roster assignments
 */
class RosterService
{
    /**
     * Check for conflicting shifts for an employee
     *
     * @param int $employeeId
     * @param Carbon $shiftStart
     * @param Carbon $shiftEnd
     * @param int|null $excludeScheduleId Exclude this schedule ID (for updates)
     * @return bool True if conflict exists
     */
    public function hasConflict(int $employeeId, Carbon $shiftStart, Carbon $shiftEnd, ?int $excludeScheduleId = null): bool
    {
        $query = ShiftSchedule::where('employee_id', $employeeId)
            ->where('status', '!=', 'CANCELLED')
            ->where(function ($q) use ($shiftStart, $shiftEnd) {
                $q->whereBetween('shift_start', [$shiftStart, $shiftEnd])
                  ->orWhereBetween('shift_end', [$shiftStart, $shiftEnd])
                  ->orWhere(function ($q2) use ($shiftStart, $shiftEnd) {
                      $q2->where('shift_start', '<=', $shiftStart)
                         ->where('shift_end', '>=', $shiftEnd);
                  });
            });

        if ($excludeScheduleId) {
            $query->where('id', '!=', $excludeScheduleId);
        }

        return $query->exists();
    }

    /**
     * Bulk assign shifts
     *
     * @param array $assignments Array of shift assignment data
     * @param int $createdByUserId User creating the assignments
     * @return array ['created' => int, 'conflicts' => array]
     */
    public function bulkAssign(array $assignments, int $createdByUserId): array
    {
        $created = 0;
        $conflicts = [];

        foreach ($assignments as $assignment) {
            $shiftStart = Carbon::parse($assignment['shift_start']);
            $shiftEnd = Carbon::parse($assignment['shift_end']);

            // Check for conflicts
            if ($this->hasConflict($assignment['employee_id'], $shiftStart, $shiftEnd)) {
                $conflicts[] = [
                    'employee_id' => $assignment['employee_id'],
                    'shift_start' => $shiftStart,
                    'shift_end' => $shiftEnd,
                    'reason' => 'Overlapping shift detected',
                ];
                continue;
            }

            // Create shift
            ShiftSchedule::create([
                'employee_id' => $assignment['employee_id'],
                'site_id' => $assignment['site_id'],
                'shift_start' => $shiftStart,
                'shift_end' => $shiftEnd,
                'is_overtime_shift' => $assignment['is_overtime_shift'] ?? false,
                'status' => 'SCHEDULED',
                'created_by_user_id' => $createdByUserId,
            ]);

            $created++;
        }

        return [
            'created' => $created,
            'conflicts' => $conflicts,
        ];
    }

    /**
     * Get upcoming shifts for an employee
     *
     * @param int $employeeId
     * @param int $days Number of days to look ahead
     * @return Collection
     */
    public function getUpcomingShifts(int $employeeId, int $days = 7): Collection
    {
        return ShiftSchedule::where('employee_id', $employeeId)
            ->where('shift_start', '>=', now())
            ->where('shift_start', '<=', now()->addDays($days))
            ->whereIn('status', ['SCHEDULED'])
            ->with(['site.client'])
            ->orderBy('shift_start')
            ->get();
    }

    /**
     * Bulk assign shifts for date range
     *
     * @param int $siteId
     * @param int $jobId
     * @param array $employeeIds
     * @param string $startDate
     * @param string $endDate
     * @param string $startTime Default start time (used if working_days_schedule not provided)
     * @param string $endTime Default end time (used if working_days_schedule not provided)
     * @param int $createdByUserId
     * @param array|null $workingDaysSchedule Optional: Day-specific schedules
     *   Format: ['monday' => ['enabled' => true, 'start_time' => '08:00', 'end_time' => '17:00'], ...]
     * @return array
     */
    public function bulkAssignShifts(
        int $siteId,
        int $jobId,
        array $employeeIds,
        string $startDate,
        string $endDate,
        string $startTime,
        string $endTime,
        int $createdByUserId,
        ?array $workingDaysSchedule = null
    ): array {
        $created = 0;
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        
        // Normalize day names to lowercase
        $dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        // Loop through each day in the range
        while ($start->lte($end)) {
            $currentDate = $start->format('Y-m-d');
            $dayName = strtolower($start->format('l')); // e.g., 'monday', 'tuesday'
            
            // Determine if this day should have a shift
            $shouldCreateShift = true;
            $dayStartTime = $startTime;
            $dayEndTime = $endTime;
            
            // If working_days_schedule is provided, check day-specific settings
            if ($workingDaysSchedule !== null && is_array($workingDaysSchedule)) {
                $daySchedule = $workingDaysSchedule[$dayName] ?? null;
                
                if ($daySchedule === null || !isset($daySchedule['enabled']) || !$daySchedule['enabled']) {
                    // This day is not enabled, skip it
                    $shouldCreateShift = false;
                } else {
                    // Use day-specific times if provided
                    if (isset($daySchedule['start_time']) && !empty($daySchedule['start_time'])) {
                        $dayStartTime = $daySchedule['start_time'];
                    }
                    if (isset($daySchedule['end_time']) && !empty($daySchedule['end_time'])) {
                        $dayEndTime = $daySchedule['end_time'];
                    }
                }
            }
            
            // Create shift for each employee if day is enabled
            if ($shouldCreateShift) {
                foreach ($employeeIds as $employeeId) {
                    // Check for conflicts before creating
                    $shiftStart = Carbon::parse($currentDate . ' ' . $dayStartTime);
                    $shiftEnd = Carbon::parse($currentDate . ' ' . $dayEndTime);
                    
                    // Ensure end time is after start time (handle overnight shifts)
                    if ($shiftEnd->lte($shiftStart)) {
                        $shiftEnd->addDay(); // Shift goes to next day
                    }
                    
                    if ($this->hasConflict($employeeId, $shiftStart, $shiftEnd)) {
                        continue; // Skip conflicting shifts
                    }
                    
                    ShiftSchedule::create([
                        'employee_id' => $employeeId,
                        'site_id' => $siteId,
                        'job_id' => $jobId,
                        'shift_start' => $shiftStart,
                        'shift_end' => $shiftEnd,
                        'is_overtime_shift' => false,
                        'status' => 'SCHEDULED',
                        'created_by_user_id' => $createdByUserId,
                        'working_days_schedule' => $workingDaysSchedule, // Store the pattern used
                    ]);
                    
                    $created++;
                }
            }
            
            $start->addDay();
        }
        
        return [
            'message' => 'Shifts assigned successfully',
            'shifts_created' => $created,
        ];
    }
}
