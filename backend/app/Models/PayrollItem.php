<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_period_id',
        'employee_id',
        'base_salary',
        'shift_allowance',
        'overtime_pay',
        'taxable_income',
        'total_gross',
        'income_tax',
        'pension_contribution',
        'pension_employer_contribution',
        'penalties',
        'bonuses',
        'asset_deductions',
        'agency_deductions',
        'loan_repayments',
        'total_deductions',
        'net_pay',
        'worked_days',
        'worked_hours',
        'overtime_hours',
        'late_days',
        'absent_days',
        'status',
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'shift_allowance' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'taxable_income' => 'decimal:2',
        'total_gross' => 'decimal:2',
        'income_tax' => 'decimal:2',
        'pension_contribution' => 'decimal:2',
        'pension_employer_contribution' => 'decimal:2',
        'penalties' => 'decimal:2',
        'bonuses' => 'decimal:2',
        'asset_deductions' => 'decimal:2',
        'agency_deductions' => 'decimal:2',
        'loan_repayments' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'worked_hours' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function payrollPeriod()
    {
        return $this->belongsTo(PayrollPeriod::class);
    }
}
