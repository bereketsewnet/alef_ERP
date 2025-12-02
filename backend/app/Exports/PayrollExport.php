<?php

namespace App\Exports;

use App\Models\Payslip;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PayrollExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $payrollPeriodId;

    public function __construct($payrollPeriodId)
    {
        $this->payrollPeriodId = $payrollPeriodId;
    }

    public function collection()
    {
        return Payslip::with(['employee.jobRole', 'payrollPeriod'])
            ->where('payroll_period_id', $this->payrollPeriodId)
            ->orderBy('employee_id')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Employee Code',
            'Employee Name',
            'Job Role',
            'Hours Worked',
            'Overtime Hours',
            'Basic Salary',
            'Overtime Amount',
            'Transport Allowance',
            'Gross Income',
            'Income Tax',
            'Pension (7%)',
            'Cost Sharing',
            'Total Deductions',
            'Net Pay',
            'Status',
        ];
    }

    public function map($payslip): array
    {
        $grossIncome = $payslip->basic_salary + $payslip->overtime_amount + $payslip->transport_allowance;
        $totalDeductions = $payslip->income_tax + $payslip->pension_7_percent + $payslip->cost_sharing + $payslip->penalty_deductions + $payslip->loan_repayment;

        return [
            $payslip->employee->employee_code,
            $payslip->employee->first_name . ' ' . $payslip->employee->last_name,
            $payslip->employee->jobRole->title,
            number_format($payslip->total_hours_worked, 2),
            number_format($payslip->overtime_hours, 2),
            number_format($payslip->basic_salary, 2),
            number_format($payslip->overtime_amount, 2),
            number_format($payslip->transport_allowance, 2),
            number_format($grossIncome, 2),
            number_format($payslip->income_tax, 2),
            number_format($payslip->pension_7_percent, 2),
            number_format($payslip->cost_sharing, 2),
            number_format($totalDeductions, 2),
            number_format($payslip->net_pay, 2),
            $payslip->status,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '2ecc71']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
        ];
    }
}
