<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShiftSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'site_id',
        'job_id',
        'shift_start',
        'shift_end',
        'is_overtime_shift',
        'status',
        'created_by_user_id',
    ];

    protected $casts = [
        'shift_start' => 'datetime',
        'shift_end' => 'datetime',
        'is_overtime_shift' => 'boolean',
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function site()
    {
        return $this->belongsTo(ClientSite::class, 'site_id');
    }

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class, 'schedule_id');
    }

    /**
     * Get effective job settings for this shift's employee
     * Uses employee's job overrides if available
     */
    public function getJobSettings(): ?array
    {
        if (!$this->job_id || !$this->employee_id) {
            return null;
        }
        
        return $this->employee->getJobSettings($this->job_id);
    }
}
