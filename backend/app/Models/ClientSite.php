<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientSite extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'site_name',
        'latitude',
        'longitude',
        'geo_radius_meters',
        'site_contact_phone',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    // Relationships
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function shiftSchedules()
    {
        return $this->hasMany(ShiftSchedule::class, 'site_id');
    }

    public function operationalReports()
    {
        return $this->hasMany(OperationalReport::class, 'site_id');
    }

    /**
     * Get all jobs required at this site
     */
    public function requiredJobs()
    {
        return $this->belongsToMany(Job::class, 'site_jobs', 'site_id', 'job_id')
            ->withPivot('positions_needed')
            ->withTimestamps();
    }

    /**
     * Check if site requires a specific job
     */
    public function requiresJob(int $jobId): bool
    {
        return $this->requiredJobs()->where('jobs.id', $jobId)->exists();
    }

    /**
     * Check if an employee has at least one job that this site requires
     */
    public function canEmployeeWork(Employee $employee): bool
    {
        $requiredJobIds = $this->requiredJobs()->pluck('jobs.id')->toArray();
        
        // If site has no job requirements, any employee can work
        if (empty($requiredJobIds)) {
            return true;
        }
        
        $employeeJobIds = $employee->jobs()->pluck('jobs.id')->toArray();
        
        // Check if there's at least one matching job
        return !empty(array_intersect($requiredJobIds, $employeeJobIds));
    }

    /**
     * Get list of matching jobs between site requirements and employee skills
     */
    public function getMatchingJobs(Employee $employee): array
    {
        $requiredJobIds = $this->requiredJobs()->pluck('jobs.id')->toArray();
        $employeeJobIds = $employee->jobs()->pluck('jobs.id')->toArray();
        
        return array_values(array_intersect($requiredJobIds, $employeeJobIds));
    }
}
