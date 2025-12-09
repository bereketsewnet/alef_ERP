<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Job extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'job_code',
        'job_name',
        'description',
        'pay_type',
        'base_salary',
        'hourly_rate',
        'overtime_multiplier',
        'tax_percent',
        'late_penalty',
        'absent_penalty',
        'agency_fee_percent',
        'is_active',
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'overtime_multiplier' => 'decimal:2',
        'tax_percent' => 'decimal:2',
        'late_penalty' => 'decimal:2',
        'absent_penalty' => 'decimal:2',
        'agency_fee_percent' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Auto-generate job_code on creation
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($job) {
            if (empty($job->job_code)) {
                $category = JobCategory::find($job->category_id);
                if ($category) {
                    $count = Job::where('category_id', $job->category_id)->withTrashed()->count() + 1;
                    $job->job_code = $category->code . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
                }
            }
        });
    }

    /**
     * Get the category this job belongs to
     */
    public function category()
    {
        return $this->belongsTo(JobCategory::class, 'category_id');
    }

    /**
     * Get all skills required for this job
     */
    public function skills()
    {
        return $this->hasMany(JobSkill::class);
    }

    /**
     * Get required skills only
     */
    public function requiredSkills()
    {
        return $this->skills()->where('is_required', true);
    }

    /**
     * Get all employees assigned to this job
     */
    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'employee_jobs')
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
     * Get all sites that require this job
     */
    public function sites()
    {
        return $this->belongsToMany(ClientSite::class, 'site_jobs', 'job_id', 'site_id')
            ->withPivot('positions_needed')
            ->withTimestamps();
    }

    /**
     * Get shift schedules for this job
     */
    public function shiftSchedules()
    {
        return $this->hasMany(ShiftSchedule::class);
    }

    /**
     * Scope to get only active jobs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get effective settings (for display or calculation without employee overrides)
     */
    public function getSettingsAttribute(): array
    {
        return [
            'pay_type' => $this->pay_type,
            'base_salary' => $this->base_salary,
            'hourly_rate' => $this->hourly_rate,
            'overtime_multiplier' => $this->overtime_multiplier,
            'tax_percent' => $this->tax_percent,
            'late_penalty' => $this->late_penalty,
            'absent_penalty' => $this->absent_penalty,
            'agency_fee_percent' => $this->agency_fee_percent,
        ];
    }
}
