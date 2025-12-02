<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AttendanceService;
use App\Models\AttendanceLog;
use App\Models\ShiftSchedule;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    private AttendanceService $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    /**
     * Clock in for a shift
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function clockIn(Request $request)
    {
        $request->validate([
            'schedule_id' => 'required|integer|exists:shift_schedules,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'initData' => 'nullable|string',
        ]);

        $user = auth()->user();
        $employeeId = $user->employee_id;

        if (!$employeeId) {
            return response()->json(['error' => 'User is not linked to an employee'], 400);
        }

        $rawInitData = $request->initData ? ['initData' => $request->initData] : null;

        $result = $this->attendanceService->clockIn(
            $employeeId,
            $request->schedule_id,
            $request->latitude,
            $request->longitude,
            $rawInitData
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
                'distance' => $result['distance'] ?? null,
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
     * Clock out from a shift
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function clockOut(Request $request)
    {
        $request->validate([
            'schedule_id' => 'required|integer|exists:shift_schedules,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $user = auth()->user();
        $employeeId = $user->employee_id;

        if (!$employeeId) {
            return response()->json(['error' => 'User is not linked to an employee'], 400);
        }

        $result = $this->attendanceService->clockOut(
            $employeeId,
            $request->schedule_id,
            $request->latitude,
            $request->longitude
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
     * Get attendance logs (filterable)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = AttendanceLog::with(['employee', 'schedule.site']);

        // Filter by employee
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('clock_in_time', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('clock_in_time', '<=', $request->end_date);
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
     * Get my attendance logs (for logged-in employee)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function myLogs(Request $request)
    {
        $user = auth()->user();
        $employeeId = $user->employee_id;

        if (!$employeeId) {
            return response()->json(['error' => 'User is not linked to an employee'], 400);
        }

        $query = AttendanceLog::with(['schedule.site.client'])
            ->where('employee_id', $employeeId);

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
     * Export attendance logs to Excel
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function exportAttendance(Request $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $siteId = $request->get('site_id');

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\AttendanceExport($startDate, $endDate, $siteId),
            'attendance_logs_' . now()->format('Y-m-d') . '.xlsx'
        );
    }
}

