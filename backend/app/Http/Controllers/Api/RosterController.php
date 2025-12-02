<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RosterService;
use App\Models\ShiftSchedule;
use Illuminate\Http\Request;

class RosterController extends Controller
{
    private RosterService $rosterService;

    public function __construct(RosterService $rosterService)
    {
        $this->rosterService = $rosterService;
    }

    public function index(Request $request)
    {
        $query = ShiftSchedule::with(['employee', 'site.client', 'createdBy']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('site_id')) {
            $query->where('site_id', $request->site_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('start_date')) {
            $query->where('shift_start', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('shift_end', '<=', $request->end_date);
        }

        return response()->json($query->orderBy('shift_start')->paginate(50));
    }

    public function bulkAssign(Request $request)
    {
        $request->validate([
            'assignments' => 'required|array',
            'assignments.*.employee_id' => 'required|exists:employees,id',
            'assignments.*.site_id' => 'required|exists:client_sites,id',
            'assignments.*.shift_start' => 'required|date',
            'assignments.*.shift_end' => 'required|date|after:assignments.*.shift_start',
            'assignments.*.is_overtime_shift' => 'sometimes|boolean',
        ]);

        $user = auth()->user();
        $result = $this->rosterService->bulkAssign($request->assignments, $user->id);

        return response()->json([
            'success' => true,
            'created' => $result['created'],
            'conflicts' => $result['conflicts'],
        ]);
    }

    public function myRoster(Request $request)
    {
        $user = auth()->user();
        $employeeId = $user->employee_id;

        if (!$employeeId) {
            return response()->json(['error' => 'User is not linked to an employee'], 400);
        }

        $days = $request->get('days', 7);
        $shifts = $this->rosterService->getUpcomingShifts($employeeId, $days);

        return response()->json($shifts);
    }
}
