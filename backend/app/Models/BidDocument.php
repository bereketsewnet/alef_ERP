<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class BidDocument extends Model { protected $guarded=[]; protected $hidden=['path']; public function bid(){return $this->belongsTo(Bid::class);} }
