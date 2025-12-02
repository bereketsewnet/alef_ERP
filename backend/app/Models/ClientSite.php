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
}
