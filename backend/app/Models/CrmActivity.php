<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmActivity extends Model
{
    protected $guarded = [];

    public function lead()
    {
        return $this->belongsTo(CrmLead::class, 'lead_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

