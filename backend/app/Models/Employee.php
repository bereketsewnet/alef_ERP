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
        'phone_number',
        'job_role_id',
        'status',
        'hire_date',
        'termination_date',
        'guarantor_details',
        'police_clearance_expiry',
        'probation_end_date',
        'bank_account_number',
        'bank_name',
    ];

    protected $casts = [
        'guarantor_details' => 'array',
        'hire_date' => 'date',
        'termination_date' => 'date',
        'police_clearance_expiry' => 'date',
        'probation_end_date' => 'date',
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

    public function payslips()
    {
        return $this->hasMany(Payslip::class);
    }
}
