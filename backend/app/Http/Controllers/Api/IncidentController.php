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
        $user = auth()->user();
        $query = OperationalReport::with(['site.client', 'reportedBy']);

        if (in_array($user->role, ['FIELD_STAFF', 'SUPERVISOR'], true) && $user->employee && str_starts_with($user->employee->employee_code, 'FS-')) {
            if (!$user->supervisedSites()->exists()) {
                return response()->json(['data' => [], 'current_page' => 1, 'last_page' => 1, 'total' => 0]);
            }
            $query->where('reported_by_employee_id', $user->employee_id)
                ->whereIn('site_id', $user->supervisedSites()->pluck('client_sites.id'));
        }

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
            'evidence' => 'nullable|array|max:10',
            'evidence.*' => 'file|max:10240|mimes:jpg,jpeg,png,webp,pdf,doc,docx,txt',
            'reported_by_name' => 'nullable|string|max:255',
        ]);

        $user = auth()->user();
        if (in_array($user->role, ['FIELD_STAFF', 'SUPERVISOR'], true) && $user->employee && str_starts_with($user->employee->employee_code, 'FS-')
            && !$user->supervisedSites()->whereKey($request->site_id)->exists()) {
            return response()->json(['error' => 'This site is not assigned to you'], 403);
        }

        $evidenceUrls = $request->input('evidence_media_urls', []);
        foreach ($request->file('evidence', []) as $file) {
            $path = $file->store('incidents/' . now()->format('Y/m'), 'public');
            $evidenceUrls[] = asset('storage/' . $path);
        }
        // Allow users without employee_id (Admins) to report incidents
        // if (!$user->employee_id) {
        //     return response()->json(['error' => 'User is not an employee'], 403);
        // }

        $report = OperationalReport::create([
            'site_id' => $request->site_id,
            'reported_by_employee_id' => $user->employee_id ?? null,
            'reported_by_name' => $request->reported_by_name ?? null,
            'report_type' => $request->report_type,
            'description' => $request->description,
            'severity_level' => $request->severity_level ?? 'LOW',
            'evidence_media_urls' => $evidenceUrls,
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

        if (in_array($user->role, ['FIELD_STAFF', 'SUPERVISOR'], true) && $user->employee && str_starts_with($user->employee->employee_code, 'FS-')
            && !$user->supervisedSites()->whereKey($request->site_id)->exists()) {
            return response()->json(['error' => 'This site is not assigned to you'], 403);
        }

        // Allow panic from admins too
        // if (!$employeeId) {
        //     return response()->json(['error' => 'User is not an employee'], 403);
        // }

        $report = OperationalReport::create([
            'site_id' => $request->site_id,
            'reported_by_employee_id' => $employeeId ?? null,
            'report_type' => 'PANIC',
            'description' => $request->description,
            'severity_level' => 'CRITICAL',
        ]);

        // Send immediate alerts to all super admins and ops managers
        $admins = \App\Models\User::whereIn('role', ['OWNER', 'GM', 'OPERATIONS'])->get();
        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\PanicAlertNotification($report));
        }

        return response()->json([
            'message' => 'Panic alert sent successfully. HQ has been notified.',
            'report' => $report,
        ], 201);
    }

    /**
     * @OA\Delete(
     *     path="/incidents/{id}",
     *     summary="Delete an incident",
     *     tags={"Incidents"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Incident deleted successfully"),
     *     @OA\Response(response=404, description="Incident not found")
     * )
     */
    public function destroy($id)
    {
        if (!in_array(auth()->user()->role, ['OWNER', 'GM', 'HR', 'OPERATIONS'], true)) {
            return response()->json(['error' => 'Only management may delete incidents'], 403);
        }
        $incident = OperationalReport::findOrFail($id);
        $incident->delete();

        return response()->json([
            'message' => 'Incident deleted successfully'
        ]);
    }
}
