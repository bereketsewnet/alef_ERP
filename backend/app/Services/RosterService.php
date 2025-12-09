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
     * @param array $employeeIds
     * @param string $startDate
     * @param string $endDate
     * @param string $startTime
     * @param string $endTime
     * @param int $createdByUserId
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
        int $createdByUserId
    ): array {
        $created = 0;
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        
        // Loop through each day in the range
        while ($start->lte($end)) {
            $currentDate = $start->format('Y-m-d');
            
            // Create shift for each employee
            foreach ($employeeIds as $employeeId) {
                ShiftSchedule::create([
                    'employee_id' => $employeeId,
                    'site_id' => $siteId,
                    'job_id' => $jobId,
                    'shift_start' => $currentDate . ' ' . $startTime,
                    'shift_end' => $currentDate . ' ' . $endTime,
                    'is_overtime_shift' => false,
                    'status' => 'SCHEDULED',
                    'created_by_user_id' => $createdByUserId,
                ]);
                
                $created++;
            }
            
            $start->addDay();
        }
        
        return [
            'message' => 'Shifts assigned successfully',
            'shifts_created' => $created,
        ];
    }
}
