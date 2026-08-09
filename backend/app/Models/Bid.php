<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bid extends Model
{
    protected $guarded = [];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function lead()
    {
        return $this->belongsTo(CrmLead::class, 'lead_id');
    }

    public function responsible()
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    public function category() { return $this->belongsTo(CrmServiceCategory::class, 'category_id'); }
    public function site() { return $this->belongsTo(ClientSite::class); }
    public function documents() { return $this->hasMany(BidDocument::class); }
}

