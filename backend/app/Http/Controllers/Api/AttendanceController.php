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
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $siteId = $request->get('site_id');

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\AttendanceExport($startDate, $endDate, $siteId),
            'attendance_logs_' . now()->format('Y-m-d') . '.xlsx'
        );
    }
}

