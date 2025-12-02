<?php

namespace App\Services;

use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Models\Employee;
use App\Models\AttendanceLog;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Payroll Service
 * 
 * Calculates payroll, applies deductions, and generates payslips
 */
class PayrollService
{
    /**
     * Generate payroll for a period
     *
     * @param int $payrollPeriodId
     * @return array ['success' => bool, 'payslips_generated' => int, 'errors' => array]
     */
    public function generatePayroll(int $payrollPeriodId): array
    {
        $period = PayrollPeriod::find($payrollPeriodId);

        if (!$period) {
            return ['success' => false, 'payslips_generated' => 0, 'errors' => ['Period not found']];
        }

        if ($period->status !== 'DRAFT') {
            return ['success' => false, 'payslips_generated' => 0, 'errors' => ['Period already processed']];
        }

        $period->update(['status' => 'PROCESSING']);

        $employees = Employee::where('status', 'ACTIVE')->get();
        $generated = 0;
        $errors = [];

        foreach ($employees as $employee) {
            try {
                $payslip = $this->generatePayslipForEmployee($period, $employee);
                
                // Send email notification to employee
                if ($employee->user && $employee->user->email) {
                    $employee->user->notify(new \App\Notifications\PayslipGenerated($payslip));
                }
                
                $generated++;
            } catch (\Exception $e) {
                $errors[] = "Employee {$employee->id}: " . $e->getMessage();
            }
        }

        $period->update([
            'status' => 'COMPLETED',
            'processed_date' => now(),
        ]);

        return [
            'success' => true,
            'payslips_generated' => $generated,
            'errors' => $errors,
        ];
    }

    /**
     * Generate payslip for a single employee
     *
     * @param PayrollPeriod $period
     * @param Employee $employee
     * @return Payslip
     */
    private function generatePayslipForEmployee(PayrollPeriod $period, Employee $employee): Payslip
    {
        // Get verified attendance logs for the period
        $attendanceLogs = AttendanceLog::where('employee_id', $employee->id)
            ->where('is_verified', true)
            ->whereNotNull('clock_in_time')
            ->whereNotNull('clock_out_time')
            ->whereBetween('clock_in_time', [$period->start_date, $period->end_date])
            ->get();

        // Calculate hours
        $totalHours = 0;
        $overtimeHours = 0;

        foreach ($attendanceLogs as $log) {
            $clockIn = Carbon::parse($log->clock_in_time);
            $clockOut = Carbon::parse($log->clock_out_time);
            $hoursWorked = $clockOut->diffInHours($clockIn);

            // Assume standard shift is 8 hours
            if ($hoursWorked > 8) {
                $overtimeHours += ($hoursWorked - 8);
                $totalHours += 8;
            } else {
                $totalHours += $hoursWorked;
            }
        }

        // Get employee's hourly rate from job role
        $hourlyRate = $employee->jobRole->base_hourly_rate;
        $basicSalary = $totalHours * $hourlyRate;

        // Calculate overtime (1.5x rate)
        $overtimeAmount = $overtimeHours * $hourlyRate * 1.5;

        // Transport allowance (configurable, hardcoded for now)
        $transportAllowance = 500;

        // Gross income
        $grossIncome = $basicSalary + $overtimeAmount + $transportAllowance;

        // Taxable income (after transport allowance exemption)
        $taxableIncome = $grossIncome - $transportAllowance;

        // Income tax (simplified progressive tax)
        $incomeTax = $this->calculateIncomeTax($taxableIncome);

        // Pension (7% employee contribution)
        $pension = $grossIncome * 0.07;

        // Cost sharing (health insurance, configurable)
        $costSharing = 100;

        // Check for asset deductions or loan repayments (TODO: implement)
        $penaltyDeductions = 0;
        $loanRepayment = 0;

        // Net pay
        $netPay = $grossIncome - $incomeTax - $pension - $costSharing - $penaltyDeductions - $loanRepayment;

        // Create payslip
        return Payslip::create([
            'payroll_period_id' => $period->id,
            'employee_id' => $employee->id,
            'basic_salary' => $basicSalary,
            'total_hours_worked' => $totalHours,
            'overtime_hours' => $overtimeHours,
            'overtime_amount' => $overtimeAmount,
            'transport_allowance' => $transportAllowance,
            'taxable_income' => $taxableIncome,
            'income_tax' => $incomeTax,
            'pension_7_percent' => $pension,
            'cost_sharing' => $costSharing,
            'penalty_deductions' => $penaltyDeductions,
            'loan_repayment' => $loanRepayment,
            'net_pay' => $netPay,
            'status' => 'PENDING',
        ]);
    }

    /**
     * Calculate income tax (simplified progressive tax)
     *
     * @param float $taxableIncome
     * @return float
     */
    private function calculateIncomeTax(float $taxableIncome): float
    {
        // Simplified tax brackets (example for Ethiopia)
        // 0-600: 0%
        // 601-1650: 10%
        // 1651-3200: 15%
        // 3201-5250: 20%
        // 5251-7800: 25%
        // 7801-10900: 30%
        // 10901+: 35%

        if ($taxableIncome <= 600) {
            return 0;
        } elseif ($taxableIncome <= 1650) {
            return ($taxableIncome - 600) * 0.10;
        } elseif ($taxableIncome <= 3200) {
            return 105 + ($taxableIncome - 1650) * 0.15;
        } elseif ($taxableIncome <= 5250) {
            return 337.5 + ($taxableIncome - 3200) * 0.20;
        } elseif ($taxableIncome <= 7800) {
            return 747.5 + ($taxableIncome - 5250) * 0.25;
        } elseif ($taxableIncome <= 10900) {
            return 1385 + ($taxableIncome - 7800) * 0.30;
        } else {
            return 2315 + ($taxableIncome - 10900) * 0.35;
        }
    }
}
