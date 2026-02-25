<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeScreening extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'category',
        'screening_date',
        'interview_passed',
        'written_exam_required',
        'written_score',
        'written_passed',
        'practical_exam_required',
        'practical_score',
        'practical_passed',
        'overall_passed',
        'vehicle_rental_cost',
        'vehicle_rental_paid_by_candidate',
        'vehicle_rental_paid_by_company',
        'notes',
    ];

    protected $casts = [
        'screening_date' => 'date',
        'interview_passed' => 'boolean',
        'written_exam_required' => 'boolean',
        'written_score' => 'integer',
        'written_passed' => 'boolean',
        'practical_exam_required' => 'boolean',
        'practical_score' => 'integer',
        'practical_passed' => 'boolean',
        'overall_passed' => 'boolean',
        'vehicle_rental_cost' => 'decimal:2',
        'vehicle_rental_paid_by_candidate' => 'decimal:2',
        'vehicle_rental_paid_by_company' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}

