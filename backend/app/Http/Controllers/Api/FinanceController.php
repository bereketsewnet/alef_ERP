<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PayrollService;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Models\Invoice;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    private PayrollService $payrollService;

    public function __construct(PayrollService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    public function createPayrollPeriod(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $period = PayrollPeriod::create($request->all());

        return response()->json($period, 201);
    }

    public function generatePayroll(Request $request)
    {
        $request->validate([
            'payroll_period_id' => 'required|exists:payroll_periods,id',
        ]);

        $result = $this->payrollService->generatePayroll($request->payroll_period_id);

        return response()->json($result);
    }

    public function getPayslips(Request $request)
    {
        $query = Payslip::with(['employee', 'payrollPeriod']);

        if ($request->has('period_id')) {
            $query->where('payroll_period_id', $request->period_id);
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        return response()->json($query->paginate(50));
    }

    public function getMyPayslips()
    {
        $user = auth()->user();
        $employeeId = $user->employee_id;

        if (!$employeeId) {
            return response()->json(['error' => 'User is not linked to an employee'], 400);
        }

        $payslips = Payslip::with('payrollPeriod')
            ->where('employee_id', $employeeId)
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($payslips);
    }

    public function getInvoices(Request $request)
    {
        $query = Invoice::with(['client', 'items']);

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('invoice_date', 'desc')->paginate(50));
    }

    /**
     * Download payslip PDF
     */
    public function downloadPayslipPdf($payslipId, \App\Services\PdfService $pdfService)
    {
        $payslip = Payslip::findOrFail($payslipId);

        // Check permission
        $user = auth()->user();
        if ($user->role !== 'SUPER_ADMIN' && $user->role !== 'FINANCE' && $user->role !== 'HR_MANAGER') {
            if ($user->employee_id !== $payslip->employee_id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        return $pdfService->generatePayslipPdf($payslip);
    }

    /**
     * Export payroll to Excel
     */
    public function exportPayroll(Request $request)
    {
        $request->validate([
            'payroll_period_id' => 'required|exists:payroll_periods,id',
        ]);

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\PayrollExport($request->payroll_period_id),
            'payroll_period_' . $request->payroll_period_id . '.xlsx'
        );
    }
}

