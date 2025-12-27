<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RosterService;
use App\Models\ShiftSchedule;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

class RosterController extends Controller
{
    private RosterService $rosterService;

    public function __construct(RosterService $rosterService)
    {
        $this->rosterService = $rosterService;
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
            auth()->id()
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
                ->with('site')
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
}
