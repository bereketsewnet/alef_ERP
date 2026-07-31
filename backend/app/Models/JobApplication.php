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
        'education',
        'experience',
    ];

    protected $casts = [
        'age' => 'integer',
    ];

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

