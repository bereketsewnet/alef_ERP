<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'vacancy_id',
        'applicant_id',
        'age',
        'sex',
        'phone_number',
        'email',
        'cv_path',
        'cv_original_name',
        'cv_mime_type',
        'cv_size_bytes',
        'education',
        'experience',
    ];

    protected $casts = [
        'age' => 'integer',
        'cv_size_bytes' => 'integer',
    ];

    protected $appends = ['cv_download_url'];

    public function getCvDownloadUrlAttribute(): ?string
    {
        return $this->cv_path ? url("/api/job-applications/{$this->id}/cv") : null;
    }

    /**
     * Jobs this applicant is applying for
     */
    public function jobs()
    {
        return $this->belongsToMany(Job::class, 'job_application_job')->withTimestamps();
    }

    public function vacancy()
    {
        return $this->belongsTo(Vacancy::class, 'vacancy_id');
    }
}

