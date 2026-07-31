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
        'clock_in_accuracy',
        'clock_in_distance',
        'clock_out_lat',
        'clock_out_long',
        'clock_out_accuracy',
        'clock_out_distance',
        'clock_out_verified',
        'clock_in_photo_url',
        'clock_out_photo_url',
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
        'clock_out_verified' => 'boolean',
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
