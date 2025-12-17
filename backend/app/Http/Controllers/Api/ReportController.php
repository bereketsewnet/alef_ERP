<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AttendanceLog;
use App\Models\Invoice;
use App\Models\ShiftSchedule;
use App\Models\OperationalReport;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel; // We might need a generic export class
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Get high-level dashboard stats for reports
     */
    public function getDashboardStats(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth());

        // Attendance Stats
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
            'attendance' => $attendanceStats,
            'finance' => $financeStats,
            'incidents' => $incidentStats,
            'roster' => $rosterStats
        ]);
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
        
        $data = [];
        $title = ucfirst($type) . " Report";
        
        switch ($type) {
            case 'attendance':
                $data = AttendanceLog::with(['schedule.employee', 'schedule.site'])
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->get()
                    ->map(function($log) {
                        return [
                            'Date' => $log->created_at->format('Y-m-d H:i'),
                            'Employee' => $log->schedule->employee->first_name . ' ' . $log->schedule->employee->last_name,
                            'Site' => $log->schedule->site->site_name,
                            'Type' => 'N/A', // Type not in model
                            'Status' => $log->flagged_late ? 'LATE' : 'PRESENT'
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
