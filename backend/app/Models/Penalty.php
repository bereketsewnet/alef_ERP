<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Penalty extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'payroll_period_id',
        'penalty_type',
        'amount',
        'penalty_date',
        'reason',
        'status',
        'approved_by_user_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'penalty_date' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function payrollPeriod()
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'PENDING');
    }

    public function scopeUnprocessed($query)
    {
        return $query->whereNull('payroll_period_id')
                     ->where('status', '!=', 'CANCELLED');
    }
}
