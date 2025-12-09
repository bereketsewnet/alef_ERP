<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'start_date',
        'end_date',
        'processed_date',
        'status', // DRAFT, PROCESSING, COMPLETED
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'processed_date' => 'datetime',
    ];

    // Relationships
    public function paddingItems()
    {
        return $this->hasMany(PayrollItem::class);
    }

    public function payrollItems()
    {
        return $this->hasMany(PayrollItem::class);
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'COMPLETED');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'DRAFT');
    }
}
