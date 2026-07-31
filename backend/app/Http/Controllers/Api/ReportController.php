<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AttendanceLog;
use App\Models\Invoice;
use App\Models\ShiftSchedule;
use App\Models\OperationalReport;
use App\Models\Employee;
use App\Models\Asset;
use App\Models\AssetAssignment;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel; // We might need a generic export class
use Carbon\Carbon;

class ReportController extends Controller
{
    private function assetReportData(?string $startDate, ?string $endDate): array
    {
        $query = Asset::with([
            'client', 'site', 'currentAssignment.employee',
            'assignments' => fn ($assignment) => $assignment->with('employee')->orderBy('assigned_at'),
        ]);

        if ($startDate) {
            $query->where('created_at', '>=', Carbon::parse($startDate)->startOfDay());
        }
        if ($endDate) {
            $query->where('created_at', '<=', Carbon::parse($endDate)->endOfDay());
        }

        $assets = $query->orderByDesc('created_at')->get();
        $inventory = $assets->map(function (Asset $asset) {
            return [
                'id' => $asset->id,
                'asset_code' => $asset->asset_code,
                'name' => $asset->name,
                'company' => $asset->client?->company_name ?? 'No company',
                'site' => $asset->site?->site_name ?? 'No site',
                'category' => $asset->category,
                'condition' => $asset->condition,
                'status' => $asset->current_assignment_status,
                'value' => (float) $asset->value,
                'current_employee' => $asset->currentAssignment?->employee
                    ? trim($asset->currentAssignment->employee->first_name . ' ' . $asset->currentAssignment->employee->last_name)
                    : null,
                'created_at' => $asset->created_at?->toDateTimeString(),
            ];
        })->values();

        $historyQuery = AssetAssignment::with(['asset.client', 'employee']);
        if ($startDate || $endDate) {
            $start = $startDate ? Carbon::parse($startDate)->startOfDay() : null;
            $end = $endDate ? Carbon::parse($endDate)->endOfDay() : null;
            $historyQuery->where(function ($query) use ($start, $end) {
                $query->where(function ($assigned) use ($start, $end) {
                    if ($start) $assigned->where('assigned_at', '>=', $start);
                    if ($end) $assigned->where('assigned_at', '<=', $end);
                })->orWhere(function ($returned) use ($start, $end) {
                    $returned->whereNotNull('returned_at');
                    if ($start) $returned->where('returned_at', '>=', $start);
                    if ($end) $returned->where('returned_at', '<=', $end);
                });
            });
        }
        $history = $historyQuery->latest('assigned_at')->get()->filter(fn ($assignment) => $assignment->asset)
            ->map(function (AssetAssignment $assignment) {
                $asset = $assignment->asset;
                return [
                    'id' => $assignment->id,
                    'asset_code' => $asset->asset_code,
                    'asset_name' => $asset->name,
                    'company' => $asset->client?->company_name ?? 'No company',
                    'category' => $asset->category,
                    'employee' => $assignment->employee
                        ? trim($assignment->employee->first_name . ' ' . $assignment->employee->last_name)
                        : 'Unknown employee',
                    'assigned_at' => $assignment->assigned_at?->toDateTimeString(),
                    'returned_at' => $assignment->returned_at?->toDateTimeString(),
                    'return_condition' => $assignment->return_condition,
                    'notes' => $assignment->notes,
                ];
            })->values();

        $byCompany = $assets->groupBy(fn ($asset) => $asset->client?->company_name ?? 'No company')
            ->map(fn ($items, $name) => ['name' => $name, 'count' => $items->count()])->values();
        $byCategory = $assets->groupBy(fn ($asset) => $asset->category ?: 'Uncategorized')
            ->map(fn ($items, $name) => ['name' => $name, 'count' => $items->count()])->values();
        $byStatus = $assets->groupBy(fn ($asset) => $asset->current_assignment_status)
            ->map(fn ($items, $name) => ['name' => ucfirst($name), 'count' => $items->count()])->values();

        return [
            'summary' => [
                'total' => $assets->count(),
                'available' => $assets->filter(fn ($asset) => $asset->current_assignment_status === 'available')->count(),
                'assigned' => $assets->filter(fn ($asset) => $asset->current_assignment_status === 'assigned')->count(),
                'total_value' => round((float) $assets->sum('value'), 2),
                'history_records' => $history->count(),
            ],
            'by_company' => $byCompany,
            'by_category' => $byCategory,
            'by_status' => $byStatus,
            'inventory' => $inventory,
            'history' => $history,
        ];
    }

    public function getAssetReport(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        return response()->json($this->assetReportData($request->start_date, $request->end_date));
    }
    /**
     * Get comprehensive dashboard stats
     */
    public function getDashboardStats(Request $request)
    {
        try {
            $startDate = $request->input('start_date', Carbon::now()->startOfMonth());
            $endDate = $request->input('end_date', Carbon::now()->endOfMonth());

        // Active Employees Count
        $activeEmployees = \App\Models\Employee::where('status', 'ACTIVE')->count();
        $lastMonthActive = \App\Models\Employee::where('status', 'ACTIVE')
            ->where('created_at', '<', Carbon::now()->subMonth()->startOfMonth())
            ->count();
        $employeeGrowth = $lastMonthActive > 0 
            ? round((($activeEmployees - $lastMonthActive) / $lastMonthActive) * 100, 1)
            : 0;

        // Attendance Today
        $today = Carbon::today();
        $attendanceToday = AttendanceLog::whereDate('clock_in_time', $today)->count();
        $attendanceRate = $activeEmployees > 0 ? round(($attendanceToday / $activeEmployees) * 100, 1) : 0;
        
        // Yesterday's attendance for comparison
        $yesterday = Carbon::yesterday();
        $attendanceYesterday = AttendanceLog::whereDate('clock_in_time', $yesterday)->count();
        $attendanceGrowth = $attendanceYesterday > 0
            ? round((($attendanceToday - $attendanceYesterday) / $attendanceYesterday) * 100, 1)
            : 0;

        // Open Incidents (all incidents, since there's no status column)
        // For now, we'll count all incidents as "open"
        $openIncidents = OperationalReport::count();
        
        // Last week's open incidents
        $lastWeekOpen = OperationalReport::where('created_at', '<', Carbon::now()->subWeek())
            ->count();
        $incidentChange = $lastWeekOpen > 0
            ? round((($openIncidents - $lastWeekOpen) / $lastWeekOpen) * 100, 1)
            : ($openIncidents > 0 ? 100 : 0);

        // Assets Stats
        $totalAssets = \App\Models\Asset::count();
        $assignedAssets = \App\Models\Asset::assigned()->count();
        $assetsInUsePercent = $totalAssets > 0 ? round(($assignedAssets / $totalAssets) * 100, 0) : 0;

        // Attendance Trend (Last 7 Days)
        $attendanceTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $clockIns = AttendanceLog::whereDate('clock_in_time', $date)->count();
            $clockOuts = AttendanceLog::whereDate('clock_out_time', $date)->count();
            $attendanceTrend[] = [
                'date' => $date->format('D'),
                'clockIns' => $clockIns,
                'clockOuts' => $clockOuts,
            ];
        }

        // Active Clock-ins (for map)
        $activeClockIns = AttendanceLog::with(['employee', 'schedule.site'])
            ->whereNotNull('clock_in_time')
            ->whereNull('clock_out_time')
            ->whereDate('clock_in_time', Carbon::today())
            ->get()
            ->map(function($log) {
                $siteName = 'Unknown';
                if ($log->schedule && $log->schedule->site) {
                    $siteName = $log->schedule->site->site_name;
                }
                
                return [
                    'id' => $log->id,
                    'employee_name' => $log->employee ? ($log->employee->first_name . ' ' . $log->employee->last_name) : 'Unknown',
                    'site_name' => $siteName,
                    'latitude' => $log->clock_in_latitude,
                    'longitude' => $log->clock_in_longitude,
                    'clock_in_time' => $log->clock_in_time ? $log->clock_in_time->toDateTimeString() : null,
                ];
            });

        // Asset Availability by Category
        $assetCategories = \App\Models\Asset::select('category', DB::raw('count(*) as total'))
            ->whereNotNull('category')
            ->groupBy('category')
            ->get()
            ->map(function($item) {
                $category = $item->category ?? 'Uncategorized';
                $assigned = \App\Models\Asset::where('category', $category)->assigned()->count();
                return [
                    'category' => $category,
                    'total' => (int)$item->total,
                    'assigned' => (int)$assigned,
                    'available' => (int)($item->total - $assigned),
                ];
            })
            ->filter(function($item) {
                return $item['total'] > 0; // Only include categories with assets
            })
            ->values(); // Re-index array

        // Attendance Stats (for reports section)
        $attendanceRaw = AttendanceLog::whereBetween('created_at', [$startDate, $endDate])
            ->select('flagged_late', DB::raw('count(*) as count'))
            ->groupBy('flagged_late')
            ->get();

        $attendanceStats = $attendanceRaw->map(function ($item) {
            return [
                'status' => $item->flagged_late ? 'LATE' : 'PRESENT',
                'count' => $item->count
            ];
        });

        // Finance Stats
        $financeStats = Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->select(
                DB::raw('COALESCE(SUM(total_amount), 0) as total_billed'),
                DB::raw("COALESCE(SUM(CASE WHEN status='PAID' THEN total_amount ELSE 0 END), 0) as total_paid"),
                DB::raw("COALESCE(SUM(CASE WHEN status='OVERDUE' THEN total_amount ELSE 0 END), 0) as total_overdue")
            )
            ->first();

        // Incident Stats
        $incidentStats = OperationalReport::whereBetween('created_at', [$startDate, $endDate])
            ->select('severity_level', DB::raw('count(*) as count'))
            ->groupBy('severity_level')
            ->get();
        
        // Roster Stats
        $rosterStats = ShiftSchedule::whereBetween('shift_start', [$startDate, $endDate])
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        return response()->json([
            'active_employees' => $activeEmployees,
            'employee_growth' => $employeeGrowth,
            'attendance_today' => $attendanceToday,
            'attendance_rate' => $attendanceRate,
            'attendance_growth' => $attendanceGrowth,
            'open_incidents' => $openIncidents,
            'incident_change' => $incidentChange,
            'total_assets' => $totalAssets,
            'assets_in_use_percent' => $assetsInUsePercent,
            'assigned_assets' => $assignedAssets,
            'attendance_trend' => $attendanceTrend,
            'active_clock_ins' => $activeClockIns,
            'asset_categories' => $assetCategories,
            // Legacy fields for reports
            'attendance' => $attendanceStats,
            'finance' => $financeStats,
            'incidents' => $incidentStats,
            'roster' => $rosterStats,
        ]);
        } catch (\Exception $e) {
            \Log::error('Dashboard stats error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to fetch dashboard stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed attendance report
     */
    public function getAttendanceReport(Request $request)
    {
        $query = AttendanceLog::with(['schedule.employee', 'schedule.site']);

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        if ($request->has('status')) {
            // Fix: Filter by flagged_late since 'status' column doesn't exist
            if ($request->status === 'LATE') {
                $query->where('flagged_late', true);
            } elseif ($request->status === 'PRESENT') {
                $query->where('flagged_late', false);
            }
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(50));
    }

    /**
     * Get detailed finance report
     */
    public function getFinanceReport(Request $request)
    {
        $query = Invoice::with(['client']);

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('invoice_date', [$request->start_date, $request->end_date]);
        }

        return response()->json($query->orderBy('invoice_date', 'desc')->paginate(50));
    }

    /**
     * Get detailed incident report
     */
    public function getIncidentsReport(Request $request)
    {
        $query = OperationalReport::with(['site', 'reportedBy']);

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(50));
    }
    
    /**
     * Get detailed roster report
     */
    public function getRosterReport(Request $request)
    {
        $query = ShiftSchedule::with(['employee', 'site', 'job']);

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('shift_start', [$request->start_date, $request->end_date]);
        }
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('shift_start', 'asc')->paginate(50));
    }

    /**
     * Generic export handler (PDF/Excel)
     * Note: In a real app, we'd separate this into Export classes.
     * For now, we'll generate headers and data on the fly.
     */
    public function exportReport(Request $request, $type)
    {
        $format = $request->input('format', 'pdf'); // pdf or excel
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $siteId = $request->input('site_id');
        
        $data = [];
        $title = ucfirst($type) . " Report";
        
        switch ($type) {
            case 'assets':
                $assetReport = $this->assetReportData($startDate, $endDate);
                if ($format === 'pdf') {
                    return Pdf::loadView('reports.asset_pdf', [
                        'title' => 'Asset Inventory and History Report',
                        'report' => $assetReport,
                        'startDate' => $startDate,
                        'endDate' => $endDate,
                    ])->setPaper('a4', 'landscape')->download('asset_report.pdf');
                }

                if ($format === 'csv') {
                    return response()->streamDownload(function () use ($assetReport) {
                        $output = fopen('php://output', 'w');
                        fputcsv($output, ['Asset Code', 'Asset', 'Company', 'Site', 'Category', 'Condition', 'Status', 'Value', 'Current Employee', 'Created At']);
                        foreach ($assetReport['inventory'] as $row) {
                            fputcsv($output, [$row['asset_code'], $row['name'], $row['company'], $row['site'], $row['category'], $row['condition'], $row['status'], $row['value'], $row['current_employee'], $row['created_at']]);
                        }
                        fputcsv($output, []);
                        fputcsv($output, ['ASSIGNMENT AND RETURN HISTORY']);
                        fputcsv($output, ['Asset Code', 'Asset', 'Company', 'Category', 'Employee', 'Assigned At', 'Returned At', 'Return Condition', 'Notes']);
                        foreach ($assetReport['history'] as $row) {
                            fputcsv($output, [$row['asset_code'], $row['asset_name'], $row['company'], $row['category'], $row['employee'], $row['assigned_at'], $row['returned_at'], $row['return_condition'], $row['notes']]);
                        }
                        fclose($output);
                    }, 'asset_report.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
                }
                abort(422, 'Asset reports support PDF or CSV format.');

            case 'attendance':
                $query = AttendanceLog::with(['employee', 'schedule.employee', 'schedule.site']);
                
                // Apply date filter
                if ($startDate && $endDate) {
                    $query->whereBetween('created_at', [$startDate, $endDate]);
                } elseif ($startDate) {
                    $query->where('created_at', '>=', $startDate);
                } elseif ($endDate) {
                    $query->where('created_at', '<=', $endDate);
                }
                
                // Apply site filter
                if ($siteId) {
                    $query->whereHas('schedule', function ($q) use ($siteId) {
                        $q->where('site_id', $siteId);
                    });
                }
                
                $data = $query->get()->map(function($log) {
                    $employee = $log->employee ?? $log->schedule->employee ?? null;
                    $employeeName = $employee ? ($employee->first_name . ' ' . $employee->last_name) : 'N/A';
                    $siteName = $log->schedule->site->site_name ?? 'N/A';
                    $verificationMethod = $log->verification_method ?? 'N/A';
                    
                    return [
                        'Date' => $log->created_at->format('Y-m-d H:i'),
                        'Employee' => $employeeName,
                        'Site' => $siteName,
                        'Method' => $verificationMethod, // GPS, MANUAL, TELEGRAM, etc.
                        'Status' => $log->flagged_late ? 'LATE' : ($log->flagged_early_leave ? 'EARLY' : ($log->clock_out_time ? 'PRESENT' : 'ACTIVE'))
                    ];
                });
                break;
                
            case 'finance':
                $data = Invoice::with(['client'])
                    ->whereBetween('invoice_date', [$startDate, $endDate])
                    ->get()
                    ->map(function($inv) {
                        return [
                            'Invoice #' => $inv->invoice_number,
                            'Client' => $inv->client->company_name,
                            'Date' => $inv->invoice_date,
                            'Amount' => $inv->total_amount,
                            'Status' => $inv->status
                        ];
                    });
                break;
            
            case 'incidents':
                 $data = OperationalReport::with(['site', 'reportedBy'])
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->get()
                    ->map(function($inc) {
                        return [
                            'ID' => $inc->id,
                            'Date' => $inc->created_at->format('Y-m-d H:i'),
                            'Site' => $inc->site->site_name,
                            'Type' => $inc->report_type,
                            'Severity' => $inc->severity_level,
                            'Reported By' => $inc->reported_by ? ($inc->reported_by->first_name . ' ' . $inc->reported_by->last_name) : 'N/A'
                        ];
                    });
                break;
                
             case 'roster':
                 $data = ShiftSchedule::with(['employee', 'site', 'job'])
                    ->whereBetween('shift_start', [$startDate, $endDate])
                    ->get()
                    ->map(function($shift) {
                        return [
                            'Date' => $shift->shift_start->format('Y-m-d'),
                            'Time' => $shift->shift_start->format('H:i') . ' - ' . $shift->shift_end->format('H:i'),
                            'Site' => $shift->site->site_name,
                            'Employee' => $shift->employee ? ($shift->employee->first_name . ' ' . $shift->employee->last_name) : 'Unassigned',
                            'Job' => $shift->job ? $shift->job->job_name : 'N/A',
                            'Status' => $shift->status
                        ];
                    });
                break;
        }

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('reports.generic_pdf', ['title' => $title, 'data' => $data]);
            return $pdf->download($type . '_report.pdf');
        } 
        
        // Fallback or Excel implementation (simplified for now)
        // Ideally use Maatwebsite/Excel to export the collection
        return response()->json(['message' => 'Excel export not fully implemented in this iteration, use PDF'], 501);
    }
}
