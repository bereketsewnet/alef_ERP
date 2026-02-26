<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceLog extends Model
{
    protected $guarded = [];

    protected $fillable = [
        'schedule_id',
        'employee_id',
        'clock_in_time',
        'clock_out_time',
        'clock_in_lat',
        'clock_in_long',
        'is_verified',
        'verification_method',
        'flagged_late',
        'with_permission',
        'verified_by_user_id',
        'raw_initdata',
        'manual_entry',
        'manual_note',
        'attendance_status',
    ];

    protected $casts = [
        'clock_in_time' => 'datetime',
        'clock_out_time' => 'datetime',
        'is_verified' => 'boolean',
        'flagged_late' => 'boolean',
        'with_permission' => 'boolean',
        'manual_entry' => 'boolean',
    ];

    public function schedule()
    {
        return $this->belongsTo(ShiftSchedule::class, 'schedule_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
