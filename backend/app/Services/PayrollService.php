<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\PayrollItem;
use App\Models\Penalty;
use App\Models\Bonus;
use App\Models\AttendanceLog;
use App\Models\ShiftSchedule;
use App\Models\Client;
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
     * Generate payroll for a given period and client
     */
    public function generatePayroll(PayrollPeriod $period, ?int $clientId = null): array
    {
        // Validate client exists if provided
        if ($clientId) {
            $client = Client::findOrFail($clientId);
            $period->update(['client_id' => $clientId]);
        }

        // Load configuration (using defaults since settings page is removed)
        $config = $this->loadConfiguration();

        // Get employees who worked shifts at client's sites during the period
        $employees = $this->getEligibleEmployees($period, $clientId);

        $generatedItems = [];
        $errors = [];

        // If no employees found, provide helpful error message
        if ($employees->isEmpty()) {
            $siteIds = \App\Models\ClientSite::where('client_id', $clientId)->pluck('id');
            $totalShifts = ShiftSchedule::whereIn('site_id', $siteIds)->count();
            $periodShifts = ShiftSchedule::whereIn('site_id', $siteIds)
                ->where('shift_start', '<=', Carbon::parse($period->end_date)->endOfDay())
                ->where('shift_end', '>=', Carbon::parse($period->start_date)->startOfDay())
                ->count();
            
            $errorMsg = "No employees found for payroll generation. ";
            $errorMsg .= "Client has " . $siteIds->count() . " site(s). ";
            $errorMsg .= "Total shifts for this client: " . $totalShifts . ". ";
            $errorMsg .= "Shifts in period (" . $period->start_date . " to " . $period->end_date . "): " . $periodShifts . ". ";
            $errorMsg .= "Please ensure shifts are created for employees at the client's sites during this period.";
            
            $errors[] = $errorMsg;
        }

        DB::beginTransaction();
        try {
            foreach ($employees as $employee) {
                try {
                    // Pre-check: validate employee has job with base salary before processing
                    $primaryJob = $employee->primaryJob() ?? $employee->jobs()->first();
                    if (!$primaryJob) {
                        $errors[] = "Skipped {$employee->first_name} {$employee->last_name}: No job assigned.";
                        continue;
                    }
                    
                    $jobSettings = $employee->getJobSettings($primaryJob->id);
                    if (!$jobSettings || empty($jobSettings['base_salary']) || $jobSettings['base_salary'] <= 0) {
                        $errors[] = "Skipped {$employee->first_name} {$employee->last_name}: No base salary configured for job '{$primaryJob->job_name}'. Please set base salary in job settings.";
                        continue;
                    }
                    
                    $payrollItem = $this->processEmployee($employee, $period, $config, $clientId);
                    $generatedItems[] = $payrollItem;
                } catch (\Exception $e) {
                    $errors[] = "Error processing {$employee->first_name} {$employee->last_name}: " . $e->getMessage();
                    \Log::error('Payroll processing error', [
                        'employee_id' => $employee->id,
                        'employee_name' => "{$employee->first_name} {$employee->last_name}",
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
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
     * Recalculate a single payroll item
     */
    public function recalculatePayrollItem(int $payrollItemId): PayrollItem
    {
        $payrollItem = PayrollItem::with(['employee', 'payrollPeriod'])->findOrFail($payrollItemId);
        $employee = $payrollItem->employee;
        $period = $payrollItem->payrollPeriod;
        $clientId = $period->client_id;

        $config = $this->loadConfiguration();
        
        return $this->processEmployee($employee, $period, $config, $clientId);
    }

    /**
     * Get employees eligible for payroll (who worked at client sites during period)
     */
    protected function getEligibleEmployees(PayrollPeriod $period, ?int $clientId): \Illuminate\Database\Eloquent\Collection
    {
        if (!$clientId) {
            // If no client specified, get all active employees
            return Employee::where(function ($query) {
                $query->where('status', 'ACTIVE')
                      ->orWhere('status', 'active');
            })
            ->orWhere(function ($query) use ($period) {
                $query->where(function ($q) {
                    $q->where('status', 'TERMINATED')
                      ->orWhere('status', 'terminated');
                })
                ->where('termination_date', '>=', $period->start_date);
            })
            ->get();
        }

        // Get all site IDs for this client
        $siteIds = \App\Models\ClientSite::where('client_id', $clientId)->pluck('id');

        if ($siteIds->isEmpty()) {
            \Log::warning('No sites found for client', ['client_id' => $clientId]);
            return collect([]);
        }

        // Get employees who worked shifts at these sites during the period
        // Use proper date handling - include the full end date
        $startDate = Carbon::parse($period->start_date)->startOfDay();
        $endDate = Carbon::parse($period->end_date)->endOfDay();

        \Log::info('Searching for shifts', [
            'site_ids' => $siteIds->toArray(),
            'start_date' => $startDate->toDateTimeString(),
            'end_date' => $endDate->toDateTimeString()
        ]);

        // Get employee IDs from shifts that overlap with the period
        $employeeIds = ShiftSchedule::whereIn('site_id', $siteIds)
            ->where(function ($query) use ($startDate, $endDate) {
                // Shift overlaps with period: shift starts before period ends AND shift ends after period starts
                $query->where('shift_start', '<=', $endDate)
                      ->where('shift_end', '>=', $startDate);
            })
            ->distinct()
            ->pluck('employee_id');

        \Log::info('Found employees from shifts', [
            'employee_ids' => $employeeIds->toArray(),
            'count' => $employeeIds->count()
        ]);

        // If no shifts found, also check attendance logs as fallback
        if ($employeeIds->isEmpty()) {
            $employeeIdsFromAttendance = \App\Models\AttendanceLog::whereHas('schedule', function ($q) use ($siteIds, $startDate, $endDate) {
                $q->whereIn('site_id', $siteIds)
                  ->where('shift_start', '<=', $endDate)
                  ->where('shift_end', '>=', $startDate);
            })
            ->whereBetween('clock_in_time', [$startDate, $endDate])
            ->distinct()
            ->pluck('employee_id');

            \Log::info('Found employees from attendance', [
                'employee_ids' => $employeeIdsFromAttendance->toArray(),
                'count' => $employeeIdsFromAttendance->count()
            ]);

            $employeeIds = $employeeIdsFromAttendance;
        }

        if ($employeeIds->isEmpty()) {
            \Log::warning('No employees found for payroll', [
                'client_id' => $clientId,
                'site_ids' => $siteIds->toArray(),
                'period' => $period->start_date . ' to ' . $period->end_date
            ]);
            return collect([]);
        }

        // Get employees with their jobs - handle both uppercase and lowercase status
        $employees = Employee::whereIn('id', $employeeIds)
            ->where(function ($query) use ($period) {
                $query->where(function ($q) {
                    $q->where('status', 'ACTIVE')
                      ->orWhere('status', 'active')
                      ->orWhere('status', 'Active');
                })
                ->orWhere(function ($q) use ($period) {
                    $q->where(function ($statusQ) {
                        $statusQ->where('status', 'TERMINATED')
                                ->orWhere('status', 'terminated')
                                ->orWhere('status', 'Terminated');
                    })
                    ->where('termination_date', '>=', $period->start_date);
                });
            })
            ->with('jobs')
            ->get();

        \Log::info('Final employees for payroll', [
            'count' => $employees->count(),
            'employee_ids' => $employees->pluck('id')->toArray()
        ]);

        return $employees;
    }

    /**
     * Process single employee for payroll
     */
    protected function processEmployee(Employee $employee, PayrollPeriod $period, array $config, ?int $clientId): PayrollItem
    {
        // Get employee's primary job (or first job if no primary)
        $primaryJob = $employee->primaryJob() ?? $employee->jobs()->first();
        
        if (!$primaryJob) {
            throw new \Exception("Employee has no assigned job");
        }

        // Get job settings with employee overrides
        $jobSettings = $employee->getJobSettings($primaryJob->id);
        if (!$jobSettings) {
            throw new \Exception("Could not retrieve job settings for job ID: {$primaryJob->id}");
        }
        
        // Validate base salary exists
        if (empty($jobSettings['base_salary']) || $jobSettings['base_salary'] <= 0) {
            throw new \Exception("Base salary is not set or is zero for job '{$primaryJob->job_name}'. Please configure base salary in job settings.");
        }

        // Calculate expected days (scheduled shifts at client sites during period)
        $expectedDays = $this->calculateExpectedDays($employee, $period, $clientId);

        // Get attendance logs for this employee during the period
        $attendanceLogs = $this->getAttendanceLogs($employee, $period, $clientId);

        // Calculate base salary (full amount, no proration)
        $baseSalary = $jobSettings['base_salary'] ?? 0;

        // Calculate penalties per occurrence
        $penaltyData = $this->calculatePenaltiesPerOccurrence($employee, $period, $attendanceLogs, $jobSettings, $clientId);
        
        // Get manual bonuses and penalties
        $manualBonuses = $this->calculateBonuses($employee, $period);
        $manualPenalties = $this->calculateManualPenalties($employee, $period);
        
        // Separate adjustments (non-taxable, added directly to net pay)
        $adjustments = $this->calculateAdjustments($employee, $period);

        // Total penalties = occurrence-based + manual
        $totalPenalties = $penaltyData['total_penalties'] + $manualPenalties;
        $attendancePenalties = $penaltyData['total_penalties'];

        // Overtime is NOT automatically calculated (set to 0)
        $overtimeHours = 0;
        $overtimePay = 0;

        // Total Gross = Base Salary + Regular Bonuses (exclude adjustments - they go directly to net pay)
        // Adjustments are bonuses with type='ADJUSTMENT', so exclude them from gross calculation
        $adjustmentAmount = $adjustments['total'];
        // Subtract only positive adjustments (bonuses) from manualBonuses
        $regularBonuses = $manualBonuses - $adjustments['positive'];
        $totalGross = $baseSalary + $regularBonuses;

        // Calculate deductions
        $assetDeductions = $this->assetService->calculateAssetDeductions($employee->id);
        
        // Tax calculation
        $taxPercent = $jobSettings['tax_percent'] ?? 0;
        $taxableIncome = max(0, $totalGross - $config['non_taxable_allowance']);
        $incomeTax = $this->calculateTax($taxableIncome, $config['tax_brackets'], $taxPercent);
        
        // Pension
        $pensionEmployee = $totalGross * ($config['pension_employee_rate'] / 100);
        $pensionEmployer = $totalGross * ($config['pension_employer_rate'] / 100);

        // Agency deductions (if applicable)
        // Use agency_fee_percent from job settings (with employee overrides)
        $agencyFeePercent = $jobSettings['agency_fee_percent'] ?? 0;
        // Apply agency fee on base salary only (not on bonuses)
        $agencyDeductions = $agencyFeePercent > 0
            ? $baseSalary * ($agencyFeePercent / 100)
            : 0;

        $totalDeductions = $incomeTax + $pensionEmployee + $totalPenalties + $assetDeductions + $agencyDeductions;
        $netPay = max(0, $totalGross - $totalDeductions);
        
        // Add adjustments directly to net pay (no taxes, no pension, no deductions)
        $netPay = $netPay + $adjustmentAmount;

        // Worked days = count of attendance logs with clock_out_time
        $workedDays = $attendanceLogs->whereNotNull('clock_out_time')->count();

        // Check if payroll item already exists to preserve status
        $existingItem = PayrollItem::where('payroll_period_id', $period->id)
            ->where('employee_id', $employee->id)
            ->where('client_id', $clientId)
            ->first();

        // Preserve existing status if item exists, otherwise set to DRAFT
        $status = $existingItem && $existingItem->status ? $existingItem->status : 'DRAFT';

        // Create/Update PayrollItem
        return PayrollItem::updateOrCreate(
            [
                'payroll_period_id' => $period->id,
                'employee_id' => $employee->id,
                'client_id' => $clientId,
            ],
            [
                'base_salary' => $baseSalary,
                'shift_allowance' => 0, // Not used for monthly employees
                'overtime_pay' => $overtimePay,
                'taxable_income' => $taxableIncome,
                'total_gross' => $totalGross,
                'income_tax' => $incomeTax,
                'pension_contribution' => $pensionEmployee,
                'pension_employer_contribution' => $pensionEmployer,
                'penalties' => $totalPenalties,
                'manual_penalties' => $manualPenalties,
                'bonuses' => $manualBonuses, // Includes adjustments for display, but adjustments are added separately to net pay
                'asset_deductions' => $assetDeductions,
                'agency_deductions' => $agencyDeductions,
                'total_deductions' => $totalDeductions,
                'net_pay' => $netPay,
                'worked_days' => $workedDays,
                'expected_days' => $expectedDays,
                'worked_hours' => 0, // Not tracking hours for monthly employees
                'overtime_hours' => $overtimeHours,
                'late_days' => $penaltyData['total_late_count'], // Total late occurrences
                'normal_late_count' => $penaltyData['normal_late_count'],
                'permission_late_count' => $penaltyData['permission_late_count'],
                'absent_days' => $penaltyData['total_absent_count'], // Total absent occurrences
                'normal_absent_count' => $penaltyData['normal_absent_count'],
                'permission_absent_count' => $penaltyData['permission_absent_count'],
                'status' => $status, // Preserve existing status
            ]
        );
    }

    /**
     * Calculate expected days (unique days with attendance logs at client sites during period)
     * This counts all days the employee actually worked at the client's sites, not just scheduled shifts
     */
    protected function calculateExpectedDays(Employee $employee, PayrollPeriod $period, ?int $clientId): int
    {
        // Use full-day boundaries for the period
        $startDate = Carbon::parse($period->start_date)->startOfDay();
        $endDate = Carbon::parse($period->end_date)->endOfDay();

        if ($clientId) {
            $siteIds = \App\Models\ClientSite::where('client_id', $clientId)->pluck('id');
            
            // Count unique days from attendance logs at client sites
            // This gives us the actual days worked, which is more accurate than scheduled shifts
            $uniqueDays = AttendanceLog::where('employee_id', $employee->id)
                ->whereBetween('clock_in_time', [$startDate, $endDate])
                ->whereHas('schedule', function ($q) use ($siteIds) {
                    $q->whereIn('site_id', $siteIds);
                })
                ->selectRaw('DATE(clock_in_time) as date')
                ->distinct()
                ->count();
            
            // If we have attendance logs, use that count
            if ($uniqueDays > 0) {
                return $uniqueDays;
            }
            
            // Fallback: count scheduled shifts if no attendance logs yet
            $shiftCount = ShiftSchedule::where('employee_id', $employee->id)
                ->where('shift_start', '<=', $endDate)
                ->where('shift_end', '>=', $startDate)
                ->whereIn('site_id', $siteIds)
                ->count();
            
            return $shiftCount;
        }
        
        // If no client filter, count all shifts
        return ShiftSchedule::where('employee_id', $employee->id)
            ->where('shift_start', '<=', $endDate)
            ->where('shift_end', '>=', $startDate)
            ->count();
    }

    /**
     * Get attendance logs for employee during period at client sites
     */
    protected function getAttendanceLogs(Employee $employee, PayrollPeriod $period, ?int $clientId): \Illuminate\Database\Eloquent\Collection
    {
        // Use full-day boundaries for the period
        $startDate = Carbon::parse($period->start_date)->startOfDay();
        $endDate = Carbon::parse($period->end_date)->endOfDay();

        $query = AttendanceLog::with('schedule.site')
            ->where('employee_id', $employee->id)
            ->whereBetween('clock_in_time', [$startDate, $endDate]);

        if ($clientId) {
            $siteIds = \App\Models\ClientSite::where('client_id', $clientId)->pluck('id');
            $query->whereHas('schedule', function ($q) use ($siteIds) {
                $q->whereIn('site_id', $siteIds);
            });
        }

        return $query->get();
    }

    /**
     * Calculate penalties per occurrence (not per day)
     * 
     * IMPORTANT LOGIC:
     * - Counts (Late N/P, Absent N/P) are ALWAYS shown in payroll table for admin visibility
     * - Money is ONLY deducted if the corresponding penalty amount is > 0 in job config or employee override
     * - If penalty is 0, the count is still shown but no money is deducted
     */
    protected function calculatePenaltiesPerOccurrence(
        Employee $employee,
        PayrollPeriod $period,
        \Illuminate\Database\Eloquent\Collection $attendanceLogs,
        array $jobSettings,
        ?int $clientId
    ): array {
        $normalLateCount = 0;
        $permissionLateCount = 0;
        $normalAbsentCount = 0;
        $permissionAbsentCount = 0;
        $totalPenalties = 0;

        $latePenalty = $jobSettings['late_penalty'] ?? 0;
        $permissionLatePenalty = $jobSettings['permission_late_penalty'] ?? 0;
        $absentPenalty = $jobSettings['absent_penalty'] ?? 0;
        $permissionAbsentPenalty = $jobSettings['permission_absent_penalty'] ?? 0;

        // Count late occurrences from attendance logs
        // NOTE: We ALWAYS count occurrences for display, but only deduct money if penalty > 0
        foreach ($attendanceLogs as $log) {
            // Check if late (flagged_late indicates late arrival)
            if ($log->flagged_late) {
                if ($log->with_permission) {
                    // Always count for display
                    $permissionLateCount++;
                    // Only deduct money if permission late penalty is configured (> 0)
                    if ($permissionLatePenalty > 0) {
                        $totalPenalties += $permissionLatePenalty;
                    }
                } else {
                    // Always count for display
                    $normalLateCount++;
                    // Only deduct money if normal late penalty is configured (> 0)
                    if ($latePenalty > 0) {
                        $totalPenalties += $latePenalty;
                    }
                }
            }
        }

        // Count absent occurrences (expected shifts without attendance logs)
        // NOTE: We ALWAYS count absences for display, but only deduct money if penalty > 0
        $expectedShifts = $this->getExpectedShifts($employee, $period, $clientId);
        $attendedShiftIds = $attendanceLogs->pluck('schedule_id')->filter()->toArray();

        foreach ($expectedShifts as $shift) {
            if (!in_array($shift->id, $attendedShiftIds)) {
                // This shift was expected but no attendance log exists = absence
                // Check if there's a penalty record for this date that might indicate permission
                $shiftDate = Carbon::parse($shift->shift_start)->toDateString();
                $hasPermissionPenalty = Penalty::where('employee_id', $employee->id)
                    ->where('penalty_type', 'ABSENT')
                    ->whereDate('penalty_date', $shiftDate)
                    ->where(function ($q) {
                        $q->whereRaw('LOWER(reason) LIKE ?', ['%permission%'])
                          ->orWhereRaw('LOWER(reason) LIKE ?', ['%with permission%']);
                    })
                    ->exists();

                if ($hasPermissionPenalty) {
                    // Always count for display
                    $permissionAbsentCount++;
                    // Only deduct money if permission absent penalty is configured (> 0)
                    if ($permissionAbsentPenalty > 0) {
                        $totalPenalties += $permissionAbsentPenalty;
                    }
                } else {
                    // Always count for display
                    $normalAbsentCount++;
                    // Only deduct money if normal absent penalty is configured (> 0)
                    if ($absentPenalty > 0) {
                        $totalPenalties += $absentPenalty;
                    }
                }
            }
        }

        return [
            'normal_late_count' => $normalLateCount,
            'permission_late_count' => $permissionLateCount,
            'normal_absent_count' => $normalAbsentCount,
            'permission_absent_count' => $permissionAbsentCount,
            'total_late_count' => $normalLateCount + $permissionLateCount,
            'total_absent_count' => $normalAbsentCount + $permissionAbsentCount,
            'total_penalties' => $totalPenalties,
        ];
    }

    /**
     * Get expected shifts for employee during period
     */
    protected function getExpectedShifts(Employee $employee, PayrollPeriod $period, ?int $clientId): \Illuminate\Database\Eloquent\Collection
    {
        $query = ShiftSchedule::where('employee_id', $employee->id)
            ->whereBetween('shift_start', [$period->start_date, $period->end_date]);

        if ($clientId) {
            $siteIds = \App\Models\ClientSite::where('client_id', $clientId)->pluck('id');
            $query->whereIn('site_id', $siteIds);
        }

        return $query->get();
    }

    /**
     * Calculate manual bonuses
     */
    protected function calculateBonuses(Employee $employee, PayrollPeriod $period): float
    {
        // Include bonuses by date range OR by payroll_period_id
        // Include ALL bonuses (including adjustments) for display purposes
        // Adjustments will be handled separately in net pay calculation
        return Bonus::where('employee_id', $employee->id)
            ->where(function ($query) use ($period) {
                $query->whereBetween('bonus_date', [$period->start_date, $period->end_date])
                      ->orWhere('payroll_period_id', $period->id);
            })
            ->where('status', '!=', 'CANCELLED')
            ->sum('amount');
    }

    /**
     * Calculate manual penalties (from penalties table)
     */
    protected function calculateManualPenalties(Employee $employee, PayrollPeriod $period): float
    {
        // Include penalties by date range OR by payroll_period_id (for adjustments)
        // Exclude ADJUSTMENT type penalties - they're handled separately
        return Penalty::where('employee_id', $employee->id)
            ->where(function ($query) use ($period) {
                $query->whereBetween('penalty_date', [$period->start_date, $period->end_date])
                      ->orWhere('payroll_period_id', $period->id);
            })
            ->where('status', '!=', 'CANCELLED')
            ->where('penalty_type', '!=', 'LATE') // Exclude late/absent as they're handled per occurrence
            ->where('penalty_type', '!=', 'ABSENT')
            ->where('penalty_type', '!=', 'ADJUSTMENT') // Exclude adjustments - handled separately
            ->sum('amount');
    }

    /**
     * Calculate adjustments (non-taxable bonuses/penalties added directly to net pay)
     */
    protected function calculateAdjustments(Employee $employee, PayrollPeriod $period): array
    {
        // Get positive adjustments (bonuses with type='ADJUSTMENT')
        $positiveAdjustments = Bonus::where('employee_id', $employee->id)
            ->where(function ($query) use ($period) {
                $query->whereBetween('bonus_date', [$period->start_date, $period->end_date])
                      ->orWhere('payroll_period_id', $period->id);
            })
            ->where('type', 'ADJUSTMENT')
            ->where('status', '!=', 'CANCELLED')
            ->sum('amount');

        // Get negative adjustments (penalties with penalty_type='ADJUSTMENT')
        $negativeAdjustments = Penalty::where('employee_id', $employee->id)
            ->where(function ($query) use ($period) {
                $query->whereBetween('penalty_date', [$period->start_date, $period->end_date])
                      ->orWhere('payroll_period_id', $period->id);
            })
            ->where('penalty_type', 'ADJUSTMENT')
            ->where('status', '!=', 'CANCELLED')
            ->sum('amount');

        $total = $positiveAdjustments - $negativeAdjustments;

        return [
            'positive' => $positiveAdjustments,
            'negative' => $negativeAdjustments,
            'total' => $total,
        ];
    }

    /**
     * Load configurable settings (using defaults since settings page is removed)
     */
    protected function loadConfiguration(): array
    {
        return [
            'tax_brackets' => [], // Will use default Ethiopian brackets
            'pension_employee_rate' => 7,
            'pension_employer_rate' => 11,
            'non_taxable_allowance' => 600,
        ];
    }

    /**
     * Calculate Income Tax based on brackets or percentage
     */
    protected function calculateTax($taxableIncome, $brackets, $taxPercent = null): float
    {
        if ($taxableIncome <= 0) return 0;

        // If tax_percent is provided from job settings, use it
        if ($taxPercent && $taxPercent > 0) {
            return $taxableIncome * ($taxPercent / 100);
        }

        // Otherwise use Ethiopian tax brackets
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
                return max(0, ($taxableIncome * ($rate / 100)) - $deduction);
            }
        }
        
        // Fallback for highest bracket
        return max(0, ($taxableIncome * 0.35) - 1500);
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

