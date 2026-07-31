<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RosterService;
use App\Models\ShiftSchedule;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use OpenApi\Annotations as OA;

class RosterController extends Controller
{
    private RosterService $rosterService;

    public function __construct(RosterService $rosterService)
    {
        $this->rosterService = $rosterService;
    }

    public function bulkAssignControllers(Request $request)
    {
        if (!in_array(auth()->user()->role, ['OWNER', 'GM', 'HR', 'OPERATIONS'], true)) {
            return response()->json(['error' => 'Only management may schedule Field Staff'], 403);
        }
        $validated = $request->validate([
            'site_id' => 'required|exists:client_sites,id',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'working_days_schedule' => 'nullable|array',
        ]);

        $users = \App\Models\User::with('employee')->whereIn('id', $validated['user_ids'])->get();
        foreach ($users as $user) {
            if (!in_array($user->role, ['FIELD_STAFF', 'SUPERVISOR'], true)) {
                return response()->json(['error' => "{$user->username} is not a Field Staff user"], 422);
            }
            if (!$user->supervisedSites()->whereKey($validated['site_id'])->exists()) {
                return response()->json(['error' => "{$user->username} is not assigned to the selected site"], 422);
            }
            if (!$user->employee_id) {
                $parts = preg_split('/[._\-\s]+/', trim($user->username), 2);
                $employee = \App\Models\Employee::create([
                    'employee_code' => 'FS-' . str_pad((string) $user->id, 6, '0', STR_PAD_LEFT),
                    'first_name' => ucfirst($parts[0] ?: 'Field'),
                    'last_name' => ucfirst($parts[1] ?? 'Staff'),
                    'email' => $user->email,
                    'phone_number' => $user->phone_number ?: 'FIELD-STAFF-' . $user->id,
                    'role' => 'FIELD_STAFF',
                    'status' => 'ACTIVE',
                    'hire_date' => Carbon::now('Africa/Addis_Ababa')->toDateString(),
                ]);
                $user->update(['employee_id' => $employee->id]);
                $user->setRelation('employee', $employee);
            }
            if (!str_starts_with($user->employee->employee_code, 'FS-')) {
                return response()->json(['error' => "{$user->username} is an employee account, not a Field Staff controller"], 422);
            }
        }

        $created = 0;
        $skipped = [];
        DB::transaction(function () use ($validated, $users, &$created, &$skipped) {
            foreach (CarbonPeriod::create($validated['start_date'], $validated['end_date']) as $day) {
                $dayKey = strtolower($day->format('l'));
                $rule = $validated['working_days_schedule'][$dayKey] ?? null;
                if ($rule && empty($rule['enabled'])) continue;
                $startTime = $rule['start_time'] ?? $validated['start_time'];
                $endTime = $rule['end_time'] ?? $validated['end_time'];
                $start = Carbon::parse($day->format('Y-m-d') . ' ' . $startTime, 'Africa/Addis_Ababa')->utc();
                $end = Carbon::parse($day->format('Y-m-d') . ' ' . $endTime, 'Africa/Addis_Ababa');
                if ($end->lte(Carbon::parse($day->format('Y-m-d') . ' ' . $startTime, 'Africa/Addis_Ababa'))) $end->addDay();
                $end = $end->utc();
                foreach ($users as $user) {
                    $overlap = ShiftSchedule::where('employee_id', $user->employee_id)
                        ->where('shift_start', '<', $end)->where('shift_end', '>', $start)->exists();
                    if ($overlap) { $skipped[] = ['user_id' => $user->id, 'date' => $day->format('Y-m-d'), 'reason' => 'overlap']; continue; }
                    ShiftSchedule::create([
                        'employee_id' => $user->employee_id, 'site_id' => $validated['site_id'], 'job_id' => null,
                        'shift_start' => $start, 'shift_end' => $end, 'status' => 'SCHEDULED',
                        'created_by_user_id' => auth()->id(), 'working_days_schedule' => $validated['working_days_schedule'] ?? null,
                    ]);
                    $created++;
                }
            }
        });
        return response()->json(['message' => "$created Field Staff shifts created", 'created' => $created, 'skipped' => $skipped]);
    }

    /**
     * @OA\Post(
     *     path="/roster/bulk-assign",
     *     summary="Bulk assign shifts to employees",
     *     tags={"Roster"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"site_id", "employee_ids", "start_date", "end_date", "start_time", "end_time"},
     *             @OA\Property(property="site_id", type="integer"),
     *             @OA\Property(property="employee_ids", type="array", @OA\Items(type="integer")),
     *             @OA\Property(property="start_date", type="string", format="date"),
     *             @OA\Property(property="end_date", type="string", format="date"),
     *             @OA\Property(property="start_time", type="string", format="time", example="08:00"),
     *             @OA\Property(property="end_time", type="string", format="time", example="17:00")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Shifts assigned successfully")
     * )
     */
    public function bulkAssign(Request $request)
    {
        // Validation
        $validated = $request->validate([
            'site_id' => 'required|exists:client_sites,id',
            'job_id' => 'required|exists:jobs,id',
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_time' => 'required',
            'end_time' => 'required',
            'working_days_schedule' => 'nullable|array',
            'working_days_schedule.*.enabled' => 'boolean',
            'working_days_schedule.*.start_time' => 'nullable|string',
            'working_days_schedule.*.end_time' => 'nullable|string',
        ]);

        $site = \App\Models\ClientSite::findOrFail($validated['site_id']);
        $job = \App\Models\Job::findOrFail($validated['job_id']);
        
        // Check if site requires this job (if site has job requirements)
        $siteJobIds = $site->requiredJobs()->pluck('jobs.id')->toArray();
        if (!empty($siteJobIds) && !in_array($validated['job_id'], $siteJobIds)) {
            return response()->json([
                'error' => "Action Failed: The site '{$site->site_name}' does not accept '{$job->job_name}' shifts. It only requires: " . 
                    $site->requiredJobs()->pluck('job_name')->implode(', ')
            ], 422);
        }
        
        // Validate each employee has the required job
        $invalidEmployees = [];
        foreach ($validated['employee_ids'] as $employeeId) {
            $employee = \App\Models\Employee::find($employeeId);
            if (!$employee->hasJob($validated['job_id'])) {
                $invalidEmployees[] = [
                    'id' => $employeeId,
                    'name' => $employee->first_name . ' ' . $employee->last_name,
                    'assigned_jobs' => $employee->jobs()->pluck('job_name')->toArray()
                ];
            }
        }
        
        if (!empty($invalidEmployees)) {
            $details = array_map(function($e) {
                $currentJobs = empty($e['assigned_jobs']) ? 'No Jobs' : implode(', ', $e['assigned_jobs']);
                return "{$e['name']} (Current: {$currentJobs})";
            }, $invalidEmployees);

            return response()->json([
                'error' => "Unable to Assign: The following employees are not qualified to work as '{$job->job_name}': " . implode(', ', $details),
                'invalid_employees' => $invalidEmployees,
                'required_job' => $job->job_name
            ], 422);
        }

        $result = $this->rosterService->bulkAssignShifts(
            $validated['site_id'],
            $validated['job_id'],
            $validated['employee_ids'],
            $validated['start_date'],
            $validated['end_date'],
            $validated['start_time'],
            $validated['end_time'],
            auth()->id(),
            $validated['working_days_schedule'] ?? null
        );

        return response()->json($result);
    }

    /**
     * @OA\Get(
     *     path="/roster/my-roster",
     *     summary="Get my upcoming shifts",
     *     tags={"Roster"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="List of upcoming shifts")
     * )
     */
    public function myRoster()
    {
        try {
            $user = auth()->user();
            if (!$user) {
                 return response()->json(['error' => 'Unauthorized'], 401);
            }
            if (!$user->employee_id) {
                return response()->json(['error' => 'User is not an employee'], 403);
            }

            $shifts = \App\Models\ShiftSchedule::where('employee_id', $user->employee_id)
                ->where('shift_start', '>=', now()->startOfDay())
                ->with(['site', 'attendanceLogs'])
                ->orderBy('shift_start')
                ->get();

            return response()->json($shifts);
        } catch (\Exception $e) {
            \Log::error('MyRoster error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/roster",
     *     summary="Get all shifts (Admin/Manager)",
     *     tags={"Roster"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="site_id", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Response(response=200, description="List of shifts")
     * )
     */
    public function index(Request $request)
    {
        $query = \App\Models\ShiftSchedule::with(['employee', 'site', 'attendanceLogs']);

        if ($request->has('site_id')) {
            $query->where('site_id', $request->site_id);
        }

        if ($request->has('date')) {
            // Use whereBetween for proper timezone handling
            $date = \Carbon\Carbon::parse($request->date)->startOfDay();
            $query->whereBetween('shift_start', [
                $date->copy()->startOfDay(),
                $date->copy()->endOfDay()
            ]);
        }

        return response()->json($query->paginate(50));
    }

    /**
     * Delete a single shift by ID.
     */
    public function destroy($id)
    {
        $shift = ShiftSchedule::find($id);
        if (!$shift) {
            return response()->json(['error' => 'Shift not found'], 404);
        }
        $shift->delete();
        return response()->json(['message' => 'Shift deleted successfully']);
    }

    /**
     * Delete all shifts for an employee (optionally filtered by date range).
     */
    public function deleteByEmployee(Request $request, $employeeId)
    {
        $query = ShiftSchedule::where('employee_id', $employeeId);

        if ($request->has('start_date')) {
            $start = \Carbon\Carbon::parse($request->start_date)->startOfDay();
            $query->where('shift_start', '>=', $start);
        }
        if ($request->has('end_date')) {
            $end = \Carbon\Carbon::parse($request->end_date)->endOfDay();
            $query->where('shift_end', '<=', $end);
        }

        $count = $query->count();
        $query->delete();

        return response()->json([
            'message' => "Deleted {$count} shift(s) for employee.",
            'deleted_count' => $count,
        ]);
    }
}
