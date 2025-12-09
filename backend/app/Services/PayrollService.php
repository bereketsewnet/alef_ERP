<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\PayrollItem;
use App\Models\PayrollSetting;
use App\Models\Penalty;
use App\Models\AttendanceLog;
use App\Services\AssetService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PayrollService
{
    protected $assetService;

    public function __construct(AssetService $assetService)
    {
        $this->assetService = $assetService;
    }

    /**
     * Generate payroll for a given period
     */
    public function generatePayroll(PayrollPeriod $period): array
    {
        // 1. Load configuration
        $config = $this->loadConfiguration();

        // 2. Identify eligible employees (active or terminated within period)
        $employees = Employee::where('status', 'ACTIVE')
            ->orWhere(function ($query) use ($period) {
                $query->where('status', 'TERMINATED')
                      ->where('termination_date', '>=', $period->start_date);
            })
            ->get();

        $generatedItems = [];
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($employees as $employee) {
                // Skip if base salary is not set
                if (!$employee->base_salary) {
                    $errors[] = "Skipped {$employee->first_name} {$employee->last_name}: No base salary defined.";
                    continue;
                }

                // 3. Process each employee
                $payrollItem = $this->processEmployee($employee, $period, $config);
                $generatedItems[] = $payrollItem;
            }

            // Update period status
            $period->update(['status' => 'PROCESSING']);
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return [
            'generated_count' => count($generatedItems),
            'errors' => $errors
        ];
    }

    /**
     * Process single employee for payroll
     */
    protected function processEmployee(Employee $employee, PayrollPeriod $period, array $config): PayrollItem
    {
        // A. Calculate Detailed Shift Earnings
        // Returns ['total_hours', 'shift_earnings', 'agency_deductions', 'late_days', 'worked_days', 'overtime_hours', 'overtime_earnings']
        $shiftData = $this->calculateShiftEarnings($employee, $period->start_date, $period->end_date, $config);

        // B. Calculate Bonuses
        $bonuses = $this->calculateBonuses($employee, $period);
        
        // B.2 Base Salary / Pay
        // If employee has a base salary, we use it. If they are hourly/shift-based, earnings come from calculateShiftEarnings
        $baseSalary = 0;
        if ($employee->base_salary) {
            $baseSalary = $config['calculate_prorated'] 
                ? $this->calculateProratedSalary($employee, $shiftData['worked_days'], $period->start_date, $period->end_date)
                : $employee->base_salary;
        }

        // Total Gross = Base + ShiftEarnings (if any) + Overtime + Bonuses
        // Note: Usually mixed mode (Salary + Shift) isn't common, but we sum them to be safe.
        // If Base Salary exists, ShiftEarnings might be treated as "Allowances" or just variable pay components.
        $totalGross = $baseSalary + $shiftData['shift_earnings'] + $shiftData['overtime_earnings'] + $bonuses;

        // C. Calculate Deductions
        
        // 1. Penalties
        $penaltyAmount = $this->calculatePenalties($employee, $period);
        $latePenalty = $shiftData['late_days'] * $config['penalty_late_fee'];
        // $absentPenalty = ... (Optional)
        
        $totalPenalties = $penaltyAmount + $latePenalty;

        // 2. Asset Deductions
        $assetDeductions = $this->assetService->calculateAssetDeductions($employee->id);
        
        // 3. Tax & Pension (on taxable income)
        $taxableIncome = $totalGross - $config['non_taxable_allowance']; 
        $incomeTax = $this->calculateTax($taxableIncome, $config['tax_brackets']);
        
        $pensionEmployee = $totalGross * ($config['pension_employee_rate'] / 100);
        $pensionEmployer = $totalGross * ($config['pension_employer_rate'] / 100);

        // 4. Agency Deductions (calculated from shifts)
        $agencyDeductions = $shiftData['agency_deductions'];

        $totalDeductions = $incomeTax + $pensionEmployee + $totalPenalties + $assetDeductions + $agencyDeductions;
        $netPay = $totalGross - $totalDeductions;

        // D. Create/Update Record
        return PayrollItem::updateOrCreate(
            [
                'payroll_period_id' => $period->id,
                'employee_id' => $employee->id,
            ],
            [
                'base_salary' => $baseSalary,
                'shift_allowance' => $shiftData['shift_earnings'], // Using shift_allowance column for variable shift pay
                'overtime_pay' => $shiftData['overtime_earnings'],
                'taxable_income' => $taxableIncome,
                'total_gross' => $totalGross,
                'income_tax' => $incomeTax,
                'pension_contribution' => $pensionEmployee,
                'pension_employer_contribution' => $pensionEmployer,
                'penalties' => $totalPenalties,
                'bonuses' => $bonuses,
                'asset_deductions' => $assetDeductions,
                'agency_deductions' => $agencyDeductions,
                'total_deductions' => $totalDeductions,
                'net_pay' => $netPay,
                'worked_days' => $shiftData['worked_days'],
                'worked_hours' => $shiftData['total_hours'],
                'overtime_hours' => $shiftData['overtime_hours'],
                'late_days' => $shiftData['late_days'],
                'status' => 'DRAFT',
            ]
        );
    }

    /**
     * Calculate detailed earnings from logs & schedule
     */
    protected function calculateShiftEarnings(Employee $employee, $startDate, $endDate, array $config): array
    {
        $logs = AttendanceLog::with('schedule.job')
            ->where('employee_id', $employee->id)
            ->whereBetween('clock_in_time', [$startDate, $endDate])
            ->whereNotNull('clock_out_time')
            ->get();

        $totalHours = 0;
        $shiftEarnings = 0;
        $agencyDeductions = 0;
        $lateDays = 0;
        $workedDays = $logs->count();

        // Default Rate fallback (from employee's primary job if available)
        $primaryJob = $employee->primaryJob();
        $defaultHourlyRate = $employee->hourly_rate ?? ($primaryJob ? $primaryJob->hourly_rate : 0);
        if (!$defaultHourlyRate && $employee->base_salary) {
            $defaultHourlyRate = $employee->base_salary / 200;
        }

        foreach ($logs as $log) {
            $clockIn = Carbon::parse($log->clock_in_time);
            $clockOut = Carbon::parse($log->clock_out_time);
            $hours = $clockOut->diffInHours($clockIn);
            $totalHours += $hours;

            if ($log->status === 'LATE') {
                $lateDays++;
            }

            // Determine Rate for this Shift from Job settings
            $rate = $defaultHourlyRate;
            $agencyFeePct = 0;

            if ($log->schedule && $log->schedule->job_id) {
                // Get job settings with employee overrides
                $jobSettings = $employee->getJobSettings($log->schedule->job_id);
                
                if ($jobSettings) {
                    // Use hourly rate or calculate from base salary
                    if ($jobSettings['pay_type'] === 'HOURLY') {
                        $rate = $jobSettings['hourly_rate'];
                    } else {
                        // For MONTHLY, calculate hourly equivalent (base_salary / 200 standard hours)
                        $rate = $jobSettings['base_salary'] / 200;
                    }
                    $agencyFeePct = $jobSettings['agency_fee_percent'];
                } elseif ($log->schedule->job) {
                    // Employee doesn't have this job, use job defaults
                    $job = $log->schedule->job;
                    if ($job->pay_type === 'HOURLY') {
                        $rate = $job->hourly_rate;
                    } else {
                        $rate = $job->base_salary / 200;
                    }
                    $agencyFeePct = $job->agency_fee_percent;
                }
            }

            // Calculate Pay for this Shift
            $payForShift = $hours * $rate;
            $shiftEarnings += $payForShift;

            // Calculate Agency Deduction
            $agencyDeductions += $payForShift * ($agencyFeePct / 100);
        }

        // Calculate Overtime (Global check)
        $standardMonthlyHours = 160; 
        $overtimeHours = max(0, $totalHours - $standardMonthlyHours);
        $overtimeMultiplier = $config['overtime_multiplier'] ?? 1.5;
        
        // Use primary job's overtime multiplier if available
        if ($primaryJob) {
            $primarySettings = $employee->getJobSettings($primaryJob->id);
            if ($primarySettings && $primarySettings['overtime_multiplier']) {
                $overtimeMultiplier = $primarySettings['overtime_multiplier'];
            }
        }
        
        $overtimeEarnings = $overtimeHours * $defaultHourlyRate * $overtimeMultiplier;

        return [
            'total_hours' => $totalHours,
            'worked_days' => $workedDays,
            'late_days' => $lateDays,
            'shift_earnings' => $shiftEarnings,
            'agency_deductions' => $agencyDeductions,
            'overtime_hours' => $overtimeHours,
            'overtime_earnings' => $overtimeEarnings
        ];
    }
    
    protected function calculateBonuses(Employee $employee, PayrollPeriod $period): float
    {
        return \App\Models\Bonus::where('employee_id', $employee->id)
            ->whereBetween('bonus_date', [$period->start_date, $period->end_date])
            ->where('status', '!=', 'CANCELLED') // Sum pending and processed
            ->sum('amount');
    }

    /**
     * Load configurable settings
     */
    protected function loadConfiguration(): array
    {
        return [
            'tax_brackets' => PayrollSetting::get('tax_brackets', []), // Default empty will fallback to standard
            'pension_employee_rate' => PayrollSetting::get('pension_employee_rate', 7),
            'pension_employer_rate' => PayrollSetting::get('pension_employer_rate', 11),
            'overtime_multiplier' => PayrollSetting::get('overtime_multiplier', 1.5),
            'penalty_late_fee' => PayrollSetting::get('penalty_late_fee', 50),
            'calculate_prorated' => PayrollSetting::get('calculate_prorated', false),
            'non_taxable_allowance' => PayrollSetting::get('non_taxable_allowance', 600),
        ];
    }

    /**
     * Calculate Income Tax based on brackets
     */
    protected function calculateTax($taxableIncome, $brackets): float
    {
        if ($taxableIncome <= 0) return 0;

        // Default Ethiopian Tax Brackets (if not configured)
        if (empty($brackets)) {
            $brackets = [
                ['min' => 0, 'max' => 600, 'rate' => 0, 'deduction' => 0],
                ['min' => 601, 'max' => 1650, 'rate' => 10, 'deduction' => 60],
                ['min' => 1651, 'max' => 3200, 'rate' => 15, 'deduction' => 142.5],
                ['min' => 3201, 'max' => 5250, 'rate' => 20, 'deduction' => 302.5],
                ['min' => 5251, 'max' => 7800, 'rate' => 25, 'deduction' => 565],
                ['min' => 7801, 'max' => 10900, 'rate' => 30, 'deduction' => 955],
                ['min' => 10901, 'max' => null, 'rate' => 35, 'deduction' => 1500],
            ];
        }

        foreach ($brackets as $bracket) {
            $min = $bracket['min'];
            $max = $bracket['max'];
            $rate = $bracket['rate'];
            $deduction = $bracket['deduction'] ?? 0;

            if ($taxableIncome >= $min && ($max === null || $taxableIncome <= $max)) {
                return ($taxableIncome * ($rate / 100)) - $deduction;
            }
        }
        
        // Fallback for highest bracket if logic specific format
        return ($taxableIncome * 0.35) - 1500;
    }

    protected function calculatePenalties(Employee $employee, PayrollPeriod $period): float
    {
        return Penalty::where('employee_id', $employee->id)
            ->whereBetween('penalty_date', [$period->start_date, $period->end_date])
            ->where('status', 'PENDING') // Actually we apply them now
            ->sum('amount');
    }
    
    protected function calculateProratedSalary($employee, $workedDays, $start, $end)
    {
        // Simple proration: (Base / 30) * worked_days
        $dailyRate = $employee->base_salary / 30;
        return $dailyRate * $workedDays;
    }

    /**
     * Approve payroll
     */
    public function approvePayroll(PayrollPeriod $period)
    {
        DB::transaction(function () use ($period) {
            // Update all items to APPROVED
            $period->payrollItems()->update(['status' => 'APPROVED']);
            
            // Mark penalties as APPLIED
            foreach ($period->payrollItems as $item) {
                Penalty::where('employee_id', $item->employee_id)
                    ->whereBetween('penalty_date', [$period->start_date, $period->end_date])
                    ->update(['status' => 'APPLIED', 'payroll_period_id' => $period->id]);
            }

            // Mark period as COMPLETED
            $period->update([
                'status' => 'COMPLETED', 
                'processed_date' => now()
            ]);
        });
    }
}
