<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'tin_number',
        'contact_person',
        'contact_phone',
        'billing_cycle',
        'address_details',
    ];

    protected $casts = [
        'address_details' => 'array',
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
