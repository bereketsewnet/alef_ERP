<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayrollPeriod;
use App\Models\PayrollItem;
use App\Models\Penalty;
use App\Models\PayrollSetting;
use App\Services\PayrollService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class PayrollController extends Controller
{
    protected $payrollService;

    public function __construct(PayrollService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    /**
     * List payroll periods
     */
    public function index(Request $request)
    {
        $periods = PayrollPeriod::orderBy('start_date', 'desc')->paginate($request->per_page ?? 10);
        return response()->json($periods);
    }

    /**
     * Create new payroll period
     */
    public function store(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $period = PayrollPeriod::create([
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'status' => 'DRAFT'
        ]);

        return response()->json($period, 201);
    }

    /**
     * Show payroll period details
     */
    public function show($id)
    {
        $period = PayrollPeriod::with(['payrollItems.employee.jobRole'])->findOrFail($id);
        return response()->json($period);
    }

    /**
     * Generate payroll for period
     */
    public function generate($id)
    {
        $period = PayrollPeriod::findOrFail($id);
        
        if ($period->status === 'COMPLETED') {
            return response()->json(['message' => 'Cannot regenerate completed payroll'], 400);
        }

        try {
            $result = $this->payrollService->generatePayroll($period);
            return response()->json([
                'message' => 'Payroll generated successfully',
                'details' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Approve payroll period
     */
    public function approve($id)
    {
        $period = PayrollPeriod::findOrFail($id);
        
        if ($period->status !== 'PROCESSING') {
            return response()->json(['message' => 'Payroll must be generated before approval'], 400);
        }

        $this->payrollService->approvePayroll($period);

        return response()->json(['message' => 'Payroll approved successfully']);
    }

    /**
     * Download Payslip PDF
     */
    public function downloadPayslip($itemId)
    {
        $item = PayrollItem::with(['employee.jobRole', 'payrollPeriod'])->findOrFail($itemId);
        
        // Structure data for PDF view
        $data = [
            'item' => $item,
            'employee' => $item->employee,
            'period' => $item->payrollPeriod,
            'company_name' => 'Alef ERP'
        ];

        // Generate PDF
        $pdf = Pdf::loadView('pdf.payslip', $data);
        return $pdf->download("payslip-{$item->employee->employee_code}-{$item->payrollPeriod->start_date}.pdf");
    }

    /**
     * Get Payroll Dashboard Stats
     */
    public function stats()
    {
        // Get generic stats
        $currentPeriod = PayrollPeriod::orderBy('start_date', 'desc')->first();
        
        return response()->json([
            'last_period' => $currentPeriod,
            'total_ytd_gross' => PayrollItem::whereHas('payrollPeriod', function($q) {
                $q->whereYear('processed_date', now()->year);
            })->sum('total_gross'),
            'total_employees' => \App\Models\Employee::where('status', 'active')->count(),
        ]);
    }

    // --- Penalties Management ---

    public function getPenalties(Request $request)
    {
        $query = Penalty::with('employee');
        
        if ($request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }

        return response()->json($query->paginate(20));
    }

    public function storePenalty(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'penalty_type' => 'required|string',
            'amount' => 'required|numeric',
            'penalty_date' => 'required|date',
            'reason' => 'nullable|string'
        ]);

        $penalty = Penalty::create($request->all());
        return response()->json($penalty, 201);
    }

    public function deletePenalty($id)
    {
        $penalty = Penalty::findOrFail($id);
        if ($penalty->status !== 'PENDING') {
            return response()->json(['message' => 'Cannot delete applied penalty'], 400);
        }
        $penalty->delete();
        return response()->json(['message' => 'Penalty deleted']);
    }

    // --- Settings Management ---

    public function getSettings()
    {
        return response()->json(PayrollSetting::where('is_active', true)->get());
    }

    public function updateSetting(Request $request, $key)
    {
        $request->validate([
            'setting_value' => 'required'
        ]);

        // Deactivate old setting
        PayrollSetting::where('setting_key', $key)->update(['is_active' => false]);

        // Create new version
        $setting = PayrollSetting::create([
            'setting_key' => $key,
            'setting_value' => $request->setting_value,
            'setting_type' => $request->setting_type ?? 'json',
            'description' => $request->description,
            'effective_from' => now(),
            'created_by_user_id' => auth()->id()
        ]);

        return response()->json($setting);
    }

    // --- Bonuses Management ---

    public function getBonuses(Request $request)
    {
        $query = \App\Models\Bonus::with('employee');
        
        if ($request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }
        if ($request->payroll_period_id) {
            $query->where('payroll_period_id', $request->payroll_period_id);
        }

        return response()->json($query->paginate(20));
    }

    public function storeBonus(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric',
            'bonus_date' => 'required|date',
            'reason' => 'required|string',
            'type' => 'nullable|string'
        ]);

        $bonus = \App\Models\Bonus::create(array_merge($request->all(), [
            'approved_by_user_id' => auth()->id(),
            'status' => 'PENDING'
        ]));

        return response()->json($bonus, 201);
    }

    public function deleteBonus($id)
    {
        $bonus = \App\Models\Bonus::findOrFail($id);
        if ($bonus->status !== 'PENDING') {
            return response()->json(['message' => 'Cannot delete processed bonus'], 400);
        }
        $bonus->delete();
        return response()->json(['message' => 'Bonus deleted']);
    }
}
