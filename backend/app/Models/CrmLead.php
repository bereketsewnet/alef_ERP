<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmLead extends Model
{
    protected $guarded = [];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function activities()
    {
        return $this->hasMany(CrmActivity::class, 'lead_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

