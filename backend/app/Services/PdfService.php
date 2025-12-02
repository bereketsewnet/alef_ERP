<?php

namespace App\Services;

use App\Models\Payslip;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * PDF Generation Service
 * 
 * Generates PDF documents for payslips, invoices, etc.
 */
class PdfService
{
    /**
     * Generate payslip PDF
     *
     * @param Payslip $payslip
     * @return \Illuminate\Http\Response
     */
    public function generatePayslipPdf(Payslip $payslip)
    {
        $payslip->load(['employee.jobRole', 'payrollPeriod']);

        $data = [
            'payslip' => $payslip,
            'employee' => $payslip->employee,
            'period' => $payslip->payrollPeriod,
            'company' => [
                'name' => 'ALEF DELTA',
                'address' => 'Addis Ababa, Ethiopia',
                'phone' => '+251 11 xxx xxxx',
                'tin' => 'XXXXXXXXXX',
            ],
        ];

        $pdf = Pdf::loadView('pdfs.payslip', $data);

        return $pdf->download('payslip_' . $payslip->employee->employee_code . '_' . $payslip->payrollPeriod->start_date->format('Y-m') . '.pdf');
    }

    /**
     * Generate payslip PDF as stream (for preview)
     *
     * @param Payslip $payslip
     * @return \Illuminate\Http\Response
     */
    public function streamPayslipPdf(Payslip $payslip)
    {
        $payslip->load(['employee.jobRole', 'payrollPeriod']);

        $data = [
            'payslip' => $payslip,
            'employee' => $payslip->employee,
            'period' => $payslip->payrollPeriod,
            'company' => [
                'name' => 'ALEF DELTA',
                'address' => 'Addis Ababa, Ethiopia',
                'phone' => '+251 11 xxx xxxx',
                'tin' => 'XXXXXXXXXX',
            ],
        ];

        $pdf = Pdf::loadView('pdfs.payslip', $data);

        return $pdf->stream();
    }
}
