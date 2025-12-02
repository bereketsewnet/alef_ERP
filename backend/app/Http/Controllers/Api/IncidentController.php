<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OperationalReport;
use Illuminate\Http\Request;

class IncidentController extends Controller
{
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
        $employeeId = $user->employee_id;

        if (!$employeeId) {
            return response()->json(['error' => 'User is not linked to an employee'], 400);
        }

        $report = OperationalReport::create([
            'site_id' => $request->site_id,
            'reported_by_employee_id' => $employeeId,
            'report_type' => $request->report_type,
            'description' => $request->description,
            'severity_level' => $request->severity_level ?? 'LOW',
            'evidence_media_urls' => $request->evidence_media_urls,
        ]);

        return response()->json($report, 201);
    }

    public function panic(Request $request)
    {
        $request->validate([
            'site_id' => 'required|exists:client_sites,id',
            'description' => 'required|string',
        ]);

        $user = auth()->user();
        $employeeId = $user->employee_id;

        if (!$employeeId) {
            return response()->json(['error' => 'User is not linked to an employee'], 400);
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
