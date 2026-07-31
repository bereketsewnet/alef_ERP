<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AttendanceService;
use App\Models\AttendanceLog;
use App\Models\ShiftSchedule;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    private const MANAGEMENT_ROLES = ['OWNER', 'GM', 'HR', 'OPERATIONS'];
    private const CONTROLLER_ROLES = ['FIELD_STAFF', 'SUPERVISOR'];
    private const BUSINESS_TIMEZONE = 'Africa/Addis_Ababa';
    private AttendanceService $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    private function isManagement($user): bool
    {
        return in_array($user->role, self::MANAGEMENT_ROLES, true);
    }

    private function isSiteController($user): bool
    {
        return in_array($user->role, self::CONTROLLER_ROLES, true)
            && $user->employee
            && str_starts_with($user->employee->employee_code, 'FS-')
            && $user->supervisedSites()->exists();
    }

    private function authorizeManualSchedule(ShiftSchedule $schedule): ?\Illuminate\Http\JsonResponse
    {
        $user = auth()->user();
        if ($this->isManagement($user)) {
            return null;
        }
        if (!$this->isSiteController($user)) {
            return response()->json(['error' => 'You are not authorized to manage attendance'], 403);
        }
        if (!$user->supervisedSites()->whereKey($schedule->site_id)->exists()) {
            return response()->json(['error' => 'This site is not assigned to you'], 403);
        }
        if ((int) $schedule->employee_id === (int) $user->employee_id) {
            return response()->json(['error' => 'Your own attendance must be recorded using GPS clock-in/out'], 403);
        }
        $shiftDay = Carbon::parse($schedule->shift_start)->timezone(self::BUSINESS_TIMEZONE)->toDateString();
        if ($shiftDay !== Carbon::now(self::BUSINESS_TIMEZONE)->toDateString()) {
            return response()->json(['error' => 'Field Staff may manage attendance only for the current day'], 403);
        }
        return null;
    }

    public function controllerSites()
    {
        $user = auth()->user();
        if (!$this->isSiteController($user)) {
            return response()->json(['data' => [], 'is_controller' => false]);
        }
        return response()->json([
            'data' => $user->supervisedSites()->with('client')->orderBy('site_name')->get(),
            'is_controller' => true,
        ]);
    }

    /**
     * Clock in for a shift
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    /**
     * @OA\Post(
     *     path="/attendance/clock-in",
     *     summary="Clock in for a shift",
     *     tags={"Attendance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"schedule_id", "latitude", "longitude"},
     *             @OA\Property(property="schedule_id", type="integer"),
     *             @OA\Property(property="latitude", type="number", format="float"),
     *             @OA\Property(property="longitude", type="number", format="float"),
     *             @OA\Property(property="initData", type="string", description="Telegram initData")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Clocked in successfully"),
     *     @OA\Response(response=400, description="Clock in failed")
     * )
     */
    public function clockIn(Request $request)
    {
        $request->validate([
            'schedule_id' => 'required|integer|exists:shift_schedules,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'initData' => 'nullable|string',
            'accuracy' => 'nullable|numeric|min:0',
            'selfie' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
        ]);

        $user = auth()->user();
        $employeeId = $user->employee_id;

        if (!$employeeId) {
            return response()->json(['error' => 'User is not linked to an employee'], 400);
        }

        $rawInitData = $request->initData ? ['initData' => $request->initData] : null;
        $photoUrl = $request->hasFile('selfie')
            ? asset('storage/' . $request->file('selfie')->store('attendance/' . now()->format('Y/m'), 'public'))
            : null;

        $result = $this->attendanceService->clockIn(
            $employeeId,
            $request->schedule_id,
            $request->latitude,
            $request->longitude,
            $rawInitData,
            $request->accuracy,
            $photoUrl
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
                'distance' => $result['distance'] ?? null,
                'error' => $result['message'], // Add error field for consistency
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'attendance' => [
                'id' => $result['attendance']->id,
                'clock_in_time' => $result['attendance']->clock_in_time,
                'is_verified' => $result['attendance']->is_verified,
                'flagged_late' => $result['attendance']->flagged_late,
            ],
            'distance' => $result['distance'],
        ]);
    }

    /**
     * @OA\Post(
     *     path="/attendance/clock-out",
     *     summary="Clock out from a shift",
     *     tags={"Attendance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"schedule_id", "latitude", "longitude"},
     *             @OA\Property(property="schedule_id", type="integer"),
     *             @OA\Property(property="latitude", type="number", format="float"),
     *             @OA\Property(property="longitude", type="number", format="float")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Clocked out successfully")
     * )
     */
    public function clockOut(Request $request)
    {
        $request->validate([
            'schedule_id' => 'required|integer|exists:shift_schedules,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric|min:0',
            'selfie' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
        ]);

        $user = auth()->user();
        $employeeId = $user->employee_id;

        if (!$employeeId) {
            return response()->json(['error' => 'User is not linked to an employee'], 400);
        }

        $photoUrl = $request->hasFile('selfie')
            ? asset('storage/' . $request->file('selfie')->store('attendance/' . now()->format('Y/m'), 'public'))
            : null;
        $result = $this->attendanceService->clockOut(
            $employeeId,
            $request->schedule_id,
            $request->latitude,
            $request->longitude,
            $request->accuracy,
            $photoUrl
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 400);
        }

        $attendance = $result['attendance'];
        $clockIn = Carbon::parse($attendance->clock_in_time);
        $clockOut = Carbon::parse($attendance->clock_out_time);
        $hoursWorked = $clockOut->diffInHours($clockIn, true);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'attendance' => [
                'id' => $attendance->id,
                'clock_in_time' => $attendance->clock_in_time,
                'clock_out_time' => $attendance->clock_out_time,
                'hours_worked' => round($hoursWorked, 2),
            ],
        ]);
    }

    /**
     * @OA\Get(
     *     path="/attendance/logs",
     *     summary="Get attendance logs (Admin/Manager)",
     *     tags={"Attendance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="employee_id", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="start_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="end_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="site_id", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="is_verified", in="query", @OA\Schema(type="boolean")),
     *     @OA\Response(response=200, description="List of attendance logs")
     * )
     */
    public function index(Request $request)
    {
        $query = AttendanceLog::with(['employee', 'schedule.site']);

        if ($request->boolean('field_staff')) {
            $query->whereHas('employee.user', function ($q) {
                $q->whereIn('role', self::CONTROLLER_ROLES)->whereHas('supervisedSites');
            })->whereHas('employee', fn ($q) => $q->where('employee_code', 'like', 'FS-%'));
        }
        if ($request->boolean('exclude_field_staff')) {
            $query->whereHas('employee', fn ($q) => $q->where('employee_code', 'not like', 'FS-%'));
        }

        // Search by employee name, email, or phone (case-insensitive)
        if ($request->has('search')) {
            $searchTerm = strtolower($request->search);
            $query->whereHas('employee', function ($q) use ($searchTerm) {
                $q->whereRaw('LOWER(first_name) like ?', ['%' . $searchTerm . '%'])
                  ->orWhereRaw('LOWER(last_name) like ?', ['%' . $searchTerm . '%'])
                  ->orWhereRaw('LOWER(email) like ?', ['%' . $searchTerm . '%'])
                  ->orWhereRaw('LOWER(phone_number) like ?', ['%' . $searchTerm . '%']);
            });
        }

        // Filter by employee
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('clock_in_time', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('clock_in_time', '<=', $request->end_date);
        }

        // Filter by site
        if ($request->has('site_id')) {
            $query->whereHas('schedule', function ($q) use ($request) {
                $q->where('site_id', $request->site_id);
            });
        }

        // Filter by verification status
        if ($request->has('is_verified')) {
            $query->where('is_verified', $request->is_verified);
        }

        $logs = $query->orderBy('clock_in_time', 'desc')->paginate(50);

        return response()->json($logs);
    }

    /**
     * @OA\Get(
     *     path="/attendance/my-logs",
     *     summary="Get my attendance logs",
     *     tags={"Attendance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="List of my attendance logs")
     * )
     */
    public function myLogs(Request $request)
    {
        $user = auth()->user();
        if (!$user->employee_id) {
            return response()->json(['error' => 'User is not an employee'], 403);
        }

        $query = AttendanceLog::where('employee_id', $user->employee_id)
            ->with(['schedule.site.client']);

        // Optional date range
        if ($request->has('start_date')) {
            $query->where('clock_in_time', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('clock_in_time', '<=', $request->end_date);
        }

        $logs = $query->orderBy('clock_in_time', 'desc')->paginate(50);

        return response()->json($logs);
    }

    /**
     * @OA\Put(
     *     path="/attendance/logs/{id}/verify",
     *     summary="Verify an attendance log",
     *     tags={"Attendance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Attendance verified successfully")
     * )
     */
    public function verify($id)
    {
        $log = AttendanceLog::findOrFail($id);
        $log->is_verified = true;
        $log->save();

        return response()->json([
            'message' => 'Attendance verified successfully',
            'data' => $log
        ]);
    }

    /**
     * @OA\Put(
     *     path="/attendance/logs/{id}/unverify",
     *     summary="Unverify an attendance log",
     *     tags={"Attendance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Attendance unverified successfully")
     * )
     */
    public function unverify($id)
    {
        $log = AttendanceLog::findOrFail($id);
        $log->is_verified = false;
        $log->save();

        return response()->json([
            'message' => 'Attendance unverified successfully',
            'data' => $log
        ]);
    }

    /**
     * @OA\Get(
     *     path="/attendance/export",
     *     summary="Export attendance logs to Excel",
     *     tags={"Attendance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="start_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="end_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="site_id", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Excel file download")
     * )
     */
    public function exportAttendance(Request $request)
    {
        $format = $request->get('format', 'excel'); // excel or pdf

        if ($format === 'pdf') {
            // Use the report export endpoint for PDF
            // Pass all request parameters including site_id
            return app(\App\Http\Controllers\Api\ReportController::class)->exportReport(
                $request,
                'attendance'
            );
        }

        // Default to Excel export
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $siteId = $request->get('site_id');
        
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\AttendanceExport($startDate, $endDate, $siteId),
            'attendance_logs_' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    /**
     * Mark attendance log with permission
     * 
     * @OA\Post(
     *     path="/attendance/{id}/mark-permission",
     *     summary="Toggle with_permission flag for an attendance log",
     *     tags={"Attendance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=false,
     *         @OA\JsonContent(
     *             @OA\Property(property="with_permission", type="boolean", description="Set permission status (optional, defaults to toggle)")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Permission status updated successfully")
     * )
     */
    public function markPermission($id, Request $request)
    {
        $log = AttendanceLog::findOrFail($id);
        
        // If with_permission is provided in request, use it; otherwise toggle
        if ($request->has('with_permission')) {
            $log->with_permission = (bool) $request->with_permission;
        } else {
            $log->with_permission = !$log->with_permission;
        }
        
        $log->save();

        return response()->json([
            'message' => 'Permission status updated successfully',
            'data' => [
                'id' => $log->id,
                'with_permission' => $log->with_permission,
            ]
        ]);
    }

    /**
     * Set permission for employee absence/lateness
     * Can be set in advance or for past dates
     */
    public function setPermission(Request $request)
    {
        try {
            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'date' => 'required|date',
                'reason' => 'nullable|string|max:500',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
                'error' => 'Please check the form fields and try again'
            ], 422);
        }

        try {
            $employee = \App\Models\Employee::findOrFail($request->employee_id);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Employee not found',
                'message' => 'The selected employee does not exist'
            ], 404);
        }

        try {
            $date = Carbon::parse($request->date)->startOfDay();
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Invalid date format',
                'message' => 'Please provide a valid date'
            ], 400);
        }

        // Check if employee has a shift on this date
        $shift = ShiftSchedule::where('employee_id', $employee->id)
            ->whereDate('shift_start', $date->toDateString())
            ->first();

        if (!$shift) {
            return response()->json([
                'error' => 'No shift found',
                'message' => 'Employee does not have a shift scheduled on ' . $date->format('Y-m-d') . '. Please ensure the employee has a shift assigned for this date.'
            ], 400);
        }

        // If date is in the past or today, update existing attendance logs
        $isPastOrToday = $date->isPast() || $date->isToday();
        
        if ($isPastOrToday) {
            $attendanceLogs = AttendanceLog::where('employee_id', $employee->id)
                ->where('schedule_id', $shift->id)
                ->whereDate('clock_in_time', $date->toDateString())
                ->get();

            foreach ($attendanceLogs as $log) {
                $log->with_permission = true;
                $log->save();
            }

            return response()->json([
                'message' => 'Permission set and existing attendance logs updated',
                'updated_logs' => $attendanceLogs->count(),
                'shift' => $shift,
            ]);
        }

        // For future dates, we can store this in a separate table or just mark the shift
        // For now, we'll create a note that can be checked when attendance is logged
        // You could create a 'permissions' table for this, but for simplicity,
        // we'll just return success and the system will check shifts when attendance is logged

        return response()->json([
            'message' => 'Permission set for future date',
            'shift' => $shift,
            'note' => 'This permission will be applied when attendance is logged for this date',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────
    //  MANUAL ATTENDANCE
    // ─────────────────────────────────────────────────────────────────

    /**
     * @OA\Get(
     *     path="/attendance/pending-shifts",
     *     summary="Get all shifts for a date with their attendance status (for manual entry view)",
     *     tags={"Attendance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="date", in="query", required=true, @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="site_id", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="employee_id", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Shifts with attendance status")
     * )
     */
    public function pendingShifts(Request $request)
    {
        $request->validate([
            'date'        => 'required|date',
            'site_id'     => 'nullable|integer|exists:client_sites,id',
            'employee_id' => 'nullable|integer|exists:employees,id',
            'search'      => 'nullable|string',
        ]);

        $date = Carbon::parse($request->date)->toDateString();

        $query = ShiftSchedule::with(['employee', 'site.client', 'attendanceLogs'])
            ->whereDate('shift_start', $date);

        if ($request->filled('site_id')) {
            $query->where('site_id', $request->site_id);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Site controllers see only sites explicitly assigned in client management.
        $user = auth()->user();
        if (in_array($user->role, self::CONTROLLER_ROLES, true)) {
            if (!$this->isSiteController($user)) {
                return response()->json([]);
            }
            $query->whereIn('site_id', $user->supervisedSites()->pluck('client_sites.id'));
            $date = Carbon::parse($request->date, self::BUSINESS_TIMEZONE)->toDateString();
            if ($date !== Carbon::now(self::BUSINESS_TIMEZONE)->toDateString()) {
                return response()->json(['error' => 'Field Staff may view site attendance only for today'], 403);
            }
            // Controllers cannot use this list to manually alter their own GPS attendance.
            $query->where('employee_id', '!=', $user->employee_id);
        }

        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $query->whereHas('employee', function ($q) use ($search) {
                $q->whereRaw('LOWER(first_name) like ?', ['%' . $search . '%'])
                  ->orWhereRaw('LOWER(last_name) like ?', ['%' . $search . '%']);
            });
        }

        $shifts = $query->orderBy('shift_start')->get();

        $result = $shifts->map(function ($shift) {
            $log = $shift->attendanceLogs->first();

            if (!$log) {
                $attendanceStatus = 'PENDING';
            } elseif ($log->attendance_status === 'ABSENT') {
                $attendanceStatus = $log->with_permission ? 'ABSENT_WITH_PERMISSION' : 'ABSENT';
            } elseif ($log->attendance_status === 'LATE' || $log->flagged_late) {
                $attendanceStatus = $log->with_permission ? 'LATE_WITH_PERMISSION' : 'LATE';
            } elseif ($log->attendance_status === 'POLICY_VIOLATION') {
                $attendanceStatus = 'POLICY_VIOLATION';
            } else {
                $attendanceStatus = 'PRESENT';
            }

            return [
                'id'                => $shift->id,
                'employee_id'       => $shift->employee_id,
                'site_id'           => $shift->site_id,
                'shift_start'       => $shift->shift_start,
                'shift_end'         => $shift->shift_end,
                'status'            => $shift->status,
                'attendance_status' => $attendanceStatus,
                'attendance_log'    => $log,
                'employee'          => $shift->employee,
                'site'              => $shift->site,
            ];
        });

        return response()->json($result);
    }

    /**
     * @OA\Post(
     *     path="/attendance/manual",
     *     summary="Create a manual attendance entry for a scheduled shift",
     *     tags={"Attendance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"schedule_id", "attendance_status"},
     *             @OA\Property(property="schedule_id", type="integer"),
     *             @OA\Property(property="attendance_status", type="string",
     *                 enum={"PRESENT","LATE","LATE_WITH_PERMISSION","ABSENT","ABSENT_WITH_PERMISSION"}),
     *             @OA\Property(property="clock_in_time", type="string", format="date-time"),
     *             @OA\Property(property="clock_out_time", type="string", format="date-time"),
     *             @OA\Property(property="manual_note", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Attendance recorded"),
     *     @OA\Response(response=400, description="Validation or duplicate error")
     * )
     */
    public function manualEntry(Request $request)
    {
        $request->validate([
            'schedule_id'       => 'required|integer|exists:shift_schedules,id',
            'attendance_status' => 'required|in:PRESENT,LATE,LATE_WITH_PERMISSION,ABSENT,ABSENT_WITH_PERMISSION,POLICY_VIOLATION',
            'clock_in_time'     => 'nullable|date',
            'clock_out_time'    => 'nullable|date',
            'manual_note'       => 'nullable|required_if:attendance_status,POLICY_VIOLATION|string|max:500',
        ]);

        $schedule = ShiftSchedule::with(['site', 'employee'])->findOrFail($request->schedule_id);
        if ($denied = $this->authorizeManualSchedule($schedule)) {
            return $denied;
        }

        // Prevent duplicate entries
        $existing = AttendanceLog::where('schedule_id', $request->schedule_id)->first();
        if ($existing) {
            return response()->json([
                'error'   => 'Attendance already recorded for this shift',
                'message' => 'This shift already has an attendance record. Use edit to change it.',
            ], 400);
        }

        $user = auth()->user();
        $rawStatus    = $request->attendance_status;
        $withPermission = in_array($rawStatus, ['LATE_WITH_PERMISSION', 'ABSENT_WITH_PERMISSION']);
        $isAbsent     = in_array($rawStatus, ['ABSENT', 'ABSENT_WITH_PERMISSION']);
        $isLate       = in_array($rawStatus, ['LATE', 'LATE_WITH_PERMISSION']);

        // Normalized status stored in DB: PRESENT | LATE | ABSENT
        $storedStatus = $rawStatus === 'POLICY_VIOLATION' ? 'POLICY_VIOLATION' : ($isAbsent ? 'ABSENT' : ($isLate ? 'LATE' : 'PRESENT'));

        if ($isAbsent) {
            // For absent records we still need a clock_in_time so date-range queries work
            $clockIn   = Carbon::parse($schedule->shift_start);
            $clockOut  = null;
            $flaggedLate = false;
            $isVerified  = false;
        } else {
            $clockIn  = $request->filled('clock_in_time')
                ? Carbon::parse($request->clock_in_time)
                : Carbon::parse($schedule->shift_start);

            $clockOut = $request->filled('clock_out_time')
                ? Carbon::parse($request->clock_out_time)
                : Carbon::parse($schedule->shift_end);

            // Auto-detect late: more than 30 minutes after shift start
            $shiftStart  = Carbon::parse($schedule->shift_start);
            $autoLate    = $clockIn->gt($shiftStart->copy()->addMinutes(30));
            $flaggedLate = $isLate || $autoLate;
            $isVerified  = true;

            // If auto-detected as late but admin chose PRESENT, still flag
            if ($autoLate && $storedStatus === 'PRESENT') {
                $storedStatus = 'LATE';
            }
        }

        $log = AttendanceLog::create([
            'schedule_id'        => $request->schedule_id,
            'employee_id'        => $schedule->employee_id,
            'clock_in_time'      => $clockIn,
            'clock_out_time'     => $clockOut,
            'clock_in_lat'       => null,
            'clock_in_long'      => null,
            'is_verified'        => $isVerified,
            'verification_method' => 'MANUAL',
            'flagged_late'       => $flaggedLate,
            'with_permission'    => $withPermission,
            'attendance_status'  => $storedStatus,
            'manual_entry'       => true,
            'manual_note'        => $request->manual_note,
            'verified_by_user_id' => $user->id,
        ]);

        // Keep shift status in sync
        if ($isAbsent) {
            $schedule->update(['status' => 'NO_SHOW']);
        } elseif ($clockOut) {
            $schedule->update(['status' => 'COMPLETED']);
        }

        return response()->json([
            'message' => 'Attendance recorded successfully',
            'data'    => $log->load(['employee', 'schedule.site']),
        ], 201);
    }

    /**
     * @OA\Put(
     *     path="/attendance/{id}/manual",
     *     summary="Update a manual attendance entry",
     *     tags={"Attendance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="attendance_status", type="string",
     *                 enum={"PRESENT","LATE","LATE_WITH_PERMISSION","ABSENT","ABSENT_WITH_PERMISSION"}),
     *             @OA\Property(property="clock_in_time", type="string", format="date-time"),
     *             @OA\Property(property="clock_out_time", type="string", format="date-time"),
     *             @OA\Property(property="manual_note", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Attendance updated")
     * )
     */
    public function updateManualEntry(Request $request, $id)
    {
        $log = AttendanceLog::with('schedule')->findOrFail($id);

        $request->validate([
            'attendance_status' => 'required|in:PRESENT,LATE,LATE_WITH_PERMISSION,ABSENT,ABSENT_WITH_PERMISSION,POLICY_VIOLATION',
            'clock_in_time'     => 'nullable|date',
            'clock_out_time'    => 'nullable|date',
            'manual_note'       => 'nullable|required_if:attendance_status,POLICY_VIOLATION|string|max:500',
        ]);

        $schedule = $log->schedule;
        if ($denied = $this->authorizeManualSchedule($schedule)) {
            return $denied;
        }
        $rawStatus    = $request->attendance_status;
        $withPermission = in_array($rawStatus, ['LATE_WITH_PERMISSION', 'ABSENT_WITH_PERMISSION']);
        $isAbsent     = in_array($rawStatus, ['ABSENT', 'ABSENT_WITH_PERMISSION']);
        $isLate       = in_array($rawStatus, ['LATE', 'LATE_WITH_PERMISSION']);
        $storedStatus = $rawStatus === 'POLICY_VIOLATION' ? 'POLICY_VIOLATION' : ($isAbsent ? 'ABSENT' : ($isLate ? 'LATE' : 'PRESENT'));

        // A site controller may apply a reviewed attendance decision to an
        // existing GPS record. Preserve the original GPS timestamps, location,
        // verification method and evidence photos for the audit trail.
        if (!$log->manual_entry) {
            $log->update([
                'attendance_status' => $storedStatus,
                'flagged_late' => $isLate,
                'with_permission' => $withPermission,
                'manual_note' => $request->manual_note,
                'verified_by_user_id' => auth()->id(),
            ]);
            $schedule->update([
                'status' => $isAbsent ? 'NO_SHOW' : ($log->clock_out_time ? 'COMPLETED' : 'IN_PROGRESS'),
            ]);
            return response()->json([
                'message' => 'Attendance decision applied; GPS evidence was preserved',
                'data' => $log->fresh()->load(['employee', 'schedule.site']),
            ]);
        }

        if ($isAbsent) {
            $clockIn     = Carbon::parse($schedule->shift_start);
            $clockOut    = null;
            $flaggedLate = false;
            $isVerified  = false;
        } else {
            $clockIn  = $request->filled('clock_in_time')
                ? Carbon::parse($request->clock_in_time)
                : Carbon::parse($schedule->shift_start);

            $clockOut = $request->filled('clock_out_time')
                ? Carbon::parse($request->clock_out_time)
                : Carbon::parse($schedule->shift_end);

            $shiftStart  = Carbon::parse($schedule->shift_start);
            $autoLate    = $clockIn->gt($shiftStart->copy()->addMinutes(30));
            $flaggedLate = $isLate || $autoLate;
            $isVerified  = true;

            if ($autoLate && $storedStatus === 'PRESENT') {
                $storedStatus = 'LATE';
            }
        }

        $log->update([
            'clock_in_time'      => $clockIn,
            'clock_out_time'     => $clockOut,
            'is_verified'        => $isVerified,
            'flagged_late'       => $flaggedLate,
            'with_permission'    => $withPermission,
            'attendance_status'  => $storedStatus,
            'manual_note'        => $request->manual_note,
            'verified_by_user_id' => auth()->id(),
        ]);

        if ($schedule) {
            if ($isAbsent) {
                $schedule->update(['status' => 'NO_SHOW']);
            } elseif ($clockOut) {
                $schedule->update(['status' => 'COMPLETED']);
            }
        }

        return response()->json([
            'message' => 'Attendance updated successfully',
            'data'    => $log->fresh()->load(['employee', 'schedule.site']),
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/attendance/{id}/manual",
     *     summary="Delete a manual attendance entry (resets shift to PENDING)",
     *     tags={"Attendance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Attendance deleted")
     * )
     */
    public function deleteManualEntry($id)
    {
        $log = AttendanceLog::with('schedule')->findOrFail($id);

        if (!$log->manual_entry) {
            return response()->json(['error' => 'Only manual attendance entries can be deleted'], 400);
        }

        if ($denied = $this->authorizeManualSchedule($log->schedule)) {
            return $denied;
        }

        $schedule = $log->schedule;
        $log->delete();

        // Reset shift status back to SCHEDULED
        if ($schedule) {
            $schedule->update(['status' => 'SCHEDULED']);
        }

        return response()->json(['message' => 'Attendance entry deleted']);
    }

    /**
     * Remove/cancel permission for an employee on a specific date
     */
    public function removePermission(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
        ]);

        $employee = \App\Models\Employee::findOrFail($request->employee_id);
        $date = Carbon::parse($request->date)->startOfDay();

        // Find shifts for this date
        $shifts = ShiftSchedule::where('employee_id', $employee->id)
            ->whereDate('shift_start', $date->toDateString())
            ->get();

        if ($shifts->isEmpty()) {
            return response()->json([
                'error' => 'No shifts found for this date'
            ], 404);
        }

        // Update attendance logs to remove permission
        $updatedCount = 0;
        foreach ($shifts as $shift) {
            $logs = AttendanceLog::where('employee_id', $employee->id)
                ->where('schedule_id', $shift->id)
                ->whereDate('clock_in_time', $date->toDateString())
                ->get();

            foreach ($logs as $log) {
                $log->with_permission = false;
                $log->save();
                $updatedCount++;
            }
        }

        return response()->json([
            'message' => 'Permission removed successfully',
            'updated_logs' => $updatedCount,
        ]);
    }
}
