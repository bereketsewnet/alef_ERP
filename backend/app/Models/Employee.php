<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_code',
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'role',
        'job_role_id',
        'status',
        'hire_date',
        'termination_date',
        'guarantor_details',
        'police_clearance_expiry',
        'probation_end_date',
        'bank_account_number',
        'bank_name',
        'base_salary',
        'hourly_rate',
        'payment_method',
    ];

    protected $casts = [
        'guarantor_details' => 'array',
        'hire_date' => 'date',
        'termination_date' => 'date',
        'police_clearance_expiry' => 'date',
        'probation_end_date' => 'date',
        'base_salary' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
    ];

    // Relationships
    public function jobRole()
    {
        return $this->belongsTo(JobRole::class);
    }

    public function user()
    {
        return $this->hasOne(User::class);
    }

    public function shiftSchedules()
    {
        return $this->hasMany(ShiftSchedule::class);
    }

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class);
    }

    public function assetAssignments()
    {
        return $this->hasMany(AssetAssignment::class, 'assigned_to_employee_id');
    }

    public function payrollItems()
    {
        return $this->hasMany(PayrollItem::class);
    }

    public function penalties()
    {
        return $this->hasMany(Penalty::class);
    }

    public function bonuses()
    {
        return $this->hasMany(Bonus::class);
    }

    /**
     * Get all jobs assigned to this employee
     */
    public function jobs()
    {
        return $this->belongsToMany(Job::class, 'employee_jobs')
            ->withPivot([
                'is_primary',
                'override_salary',
                'override_hourly_rate',
                'override_tax_percent',
                'override_late_penalty',
                'override_absent_penalty',
                'override_agency_fee_percent',
                'override_overtime_multiplier',
            ])
            ->withTimestamps();
    }

    /**
     * Get the primary job for this employee
     */
    public function primaryJob()
    {
        return $this->jobs()->wherePivot('is_primary', true)->first();
    }

    /**
     * Check if employee has a specific job
     */
    public function hasJob(int $jobId): bool
    {
        return $this->jobs()->where('jobs.id', $jobId)->exists();
    }

    /**
     * Get effective job settings for this employee (with overrides applied)
     * Returns null if employee doesn't have this job
     */
    public function getJobSettings(int $jobId): ?array
    {
        $job = $this->jobs()->where('jobs.id', $jobId)->first();
        
        if (!$job) {
            return null;
        }

        return [
            'job_id' => $job->id,
            'job_name' => $job->job_name,
            'job_code' => $job->job_code,
            'pay_type' => $job->pay_type,
            'base_salary' => $job->pivot->override_salary ?? $job->base_salary,
            'hourly_rate' => $job->pivot->override_hourly_rate ?? $job->hourly_rate,
            'tax_percent' => $job->pivot->override_tax_percent ?? $job->tax_percent,
            'late_penalty' => $job->pivot->override_late_penalty ?? $job->late_penalty,
            'absent_penalty' => $job->pivot->override_absent_penalty ?? $job->absent_penalty,
            'agency_fee_percent' => $job->pivot->override_agency_fee_percent ?? $job->agency_fee_percent,
            'overtime_multiplier' => $job->pivot->override_overtime_multiplier ?? $job->overtime_multiplier,
        ];
    }
}
