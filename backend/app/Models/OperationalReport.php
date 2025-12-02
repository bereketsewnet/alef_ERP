<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperationalReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_id',
        'reported_by_employee_id',
        'report_type',
        'description',
        'evidence_media_urls',
        'severity_level',
    ];

    protected $casts = [
        'evidence_media_urls' => 'array',
    ];

    public function site()
    {
        return $this->belongsTo(ClientSite::class, 'site_id');
    }

    public function reportedBy()
    {
        return $this->belongsTo(Employee::class, 'reported_by_employee_id');
    }
}
