<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PayrollService;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Models\Invoice;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

class FinanceController extends Controller
{
    private PayrollService $payrollService;

    public function __construct(PayrollService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    /**
     * @OA\Post(
     *     path="/finance/payroll-periods",
     *     summary="Create a new payroll period",
     *     tags={"Finance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"start_date", "end_date"},
     *             @OA\Property(property="start_date", type="string", format="date"),
     *             @OA\Property(property="end_date", type="string", format="date")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Payroll period created")
     * )
     */
    public function createPayrollPeriod(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $period = PayrollPeriod::create($request->all());

        return response()->json($period, 201);
    }

    /**
     * @OA\Post(
     *     path="/finance/generate-payroll",
     *     summary="Generate payroll for a period",
     *     tags={"Finance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"payroll_period_id"},
     *             @OA\Property(property="payroll_period_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Payroll generation started")
     * )
     */
    public function generatePayroll(Request $request)
    {
        $request->validate([
            'payroll_period_id' => 'required|exists:payroll_periods,id',
        ]);

        $period = PayrollPeriod::findOrFail($request->payroll_period_id);
        $result = $this->payrollService->generatePayroll($period);
        return response()->json($result);
    }

    /**
     * @OA\Get(
     *     path="/finance/payslips",
     *     summary="Get all payslips (Admin/Finance)",
     *     tags={"Finance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="payroll_period_id", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="employee_id", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="List of payslips")
     * )
     */
    public function getPayslips(Request $request)
    {
        $query = Payslip::with(['employee', 'payrollPeriod']);

        if ($request->has('payroll_period_id')) {
            $query->where('payroll_period_id', $request->payroll_period_id);
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * @OA\Get(
     *     path="/finance/my-payslips",
     *     summary="Get my payslips",
     *     tags={"Finance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="List of my payslips")
     * )
     */
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
            ->get();

        return response()->json($payslips);
    }

    /**
     * @OA\Get(
     *     path="/finance/invoices",
     *     summary="Get invoices",
     *     tags={"Finance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="client_id", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="status", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="List of invoices")
     * )
     */
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
     * @OA\Get(
     *     path="/finance/payslips/{id}/download",
     *     summary="Download payslip PDF",
     *     tags={"Finance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="PDF file download")
     * )
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
     * @OA\Get(
     *     path="/finance/payroll/export",
     *     summary="Export payroll to Excel",
     *     tags={"Finance"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="payroll_period_id", in="query", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Excel file download")
     * )
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

