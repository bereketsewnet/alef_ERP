<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    protected $guarded = [];

    protected $casts = [
        'start_date' => 'date', 'end_date' => 'date', 'contract_amount' => 'decimal:2',
        'terminated_at' => 'datetime', 'archived_at' => 'datetime', 'reminder_sent_at' => 'datetime',
    ];

    protected $appends = ['days_remaining', 'expiry_state'];

    public function client() { return $this->belongsTo(Client::class); }
    public function site() { return $this->belongsTo(ClientSite::class); }
    public function categories() { return $this->belongsToMany(CrmServiceCategory::class, 'contract_crm_service_category'); }
    public function documents() { return $this->hasMany(CrmContractDocument::class); }
    public function issues() { return $this->hasMany(CrmCustomerIssue::class); }

    public function getDaysRemainingAttribute(): int { return (int) today()->diffInDays($this->end_date, false); }
    public function getExpiryStateAttribute(): string
    {
        if ($this->status === 'TERMINATED') return 'TERMINATED';
        if ($this->days_remaining < 0) return 'EXPIRED';
        if ($this->days_remaining <= 7) return 'URGENT';
        if ($this->days_remaining <= ($this->expiry_reminder_days ?: 30)) return 'WARNING';
        return 'OK';
    }
}
