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
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel; // We might need a generic export class
use Carbon\Carbon;

class ReportController extends Controller
{
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
