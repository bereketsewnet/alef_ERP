<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OperationalReport;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

class IncidentController extends Controller
{


    /**
     * @OA\Get(
     *     path="/incidents",
     *     summary="List all incidents",
     *     tags={"Incidents"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="site_id", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="severity_level", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="report_type", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="List of incidents")
     * )
     */
    public function index(Request $request)
    {
        $query = OperationalReport::with(['site.client', 'reportedBy']);

        if ($request->has('site_id')) {
            $query->where('site_id', $request->site_id);
        }

        if ($request->has('severity_level')) {
            $query->where('severity_level', $request->severity_level);
        }

        if ($request->has('report_type')) {
            $query->where('report_type', $request->report_type);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(50));
    }

    /**
     * @OA\Post(
     *     path="/incidents",
     *     summary="Report an incident",
     *     tags={"Incidents"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"site_id", "report_type", "description"},
     *             @OA\Property(property="site_id", type="integer"),
     *             @OA\Property(property="report_type", type="string", example="INCIDENT"),
     *             @OA\Property(property="description", type="string"),
     *             @OA\Property(property="severity_level", type="string", example="MEDIUM")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Incident reported")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'site_id' => 'required|exists:client_sites,id',
            'report_type' => 'required|string',
            'description' => 'required|string',
            'severity_level' => 'sometimes|string',
            'evidence_media_urls' => 'nullable|array',
        ]);

        $user = auth()->user();
        if (!$user->employee_id) {
            return response()->json(['error' => 'User is not an employee'], 403);
        }

        $report = OperationalReport::create([
            'site_id' => $request->site_id,
            'reported_by_employee_id' => $user->employee_id,
            'report_type' => $request->report_type,
            'description' => $request->description,
            'severity_level' => $request->severity_level ?? 'LOW',
        ]);

        return response()->json($report, 201);
    }

    /**
     * @OA\Post(
     *     path="/incidents/panic",
     *     summary="Trigger panic button",
     *     tags={"Incidents"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"site_id", "description"},
     *             @OA\Property(property="site_id", type="integer"),
     *             @OA\Property(property="description", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Panic alert sent")
     * )
     */
    public function panic(Request $request)
    {
        $request->validate([
            'site_id' => 'required|exists:client_sites,id',
            'description' => 'required|string',
        ]);

        $user = auth()->user();
        $employeeId = $user->employee_id;

        if (!$employeeId) {
            return response()->json(['error' => 'User is not an employee'], 403);
        }

        $report = OperationalReport::create([
            'site_id' => $request->site_id,
            'reported_by_employee_id' => $employeeId,
            'report_type' => 'PANIC',
            'description' => $request->description,
            'severity_level' => 'CRITICAL',
        ]);

        // Send immediate alerts to all super admins and ops managers
        $admins = \App\Models\User::whereIn('role', ['SUPER_ADMIN', 'OPS_MANAGER'])->get();
        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\PanicAlertNotification($report));
        }

        return response()->json([
            'message' => 'Panic alert sent successfully. HQ has been notified.',
            'report' => $report,
        ], 201);
    }
}
