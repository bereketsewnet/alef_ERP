<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'description',
        'tin_number',
        'contact_person',
        'contact_phone',
        'email',
        'billing_cycle',
        'payment_due_day',
        'payment_grace_days',
        'late_penalty_type',
        'late_penalty_value',
        'late_penalty_recurring',
        'preferred_calendar', // 'EC' = Ethiopian, 'GC' = Gregorian (for Billing & Invoices)
        'address_details',
    ];

    protected $casts = [
        'address_details' => 'array',
        'late_penalty_value' => 'decimal:2',
        'late_penalty_recurring' => 'boolean',
    ];

    public function sites()
    {
        return $this->hasMany(ClientSite::class);
    }

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
