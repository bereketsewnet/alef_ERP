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
        $request->validate([
            'site_id' => 'required|exists:client_sites,id',
            'employee_ids' => 'required|array',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_time' => 'required',
            'end_time' => 'required',
        ]);

        $result = $this->rosterService->bulkAssignShifts(
            $request->site_id,
            $request->employee_ids,
            $request->start_date,
            $request->end_date,
            $request->start_time,
            $request->end_time,
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
        $user = auth()->user();
        if (!$user->employee_id) {
            return response()->json(['error' => 'User is not an employee'], 403);
        }

        $shifts = \App\Models\ShiftSchedule::where('employee_id', $user->employee_id)
            ->where('date', '>=', now()->toDateString())
            ->with('site')
            ->orderBy('date')
            ->get();

        return response()->json($shifts);
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
