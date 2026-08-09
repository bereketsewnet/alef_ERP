<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CrmContractDocument extends Model { protected $guarded = []; protected $hidden = ['path']; public function contract(){ return $this->belongsTo(Contract::class); } }
