<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CrmCustomerIssue extends Model { protected $guarded=[]; protected $casts=['resolved_at'=>'datetime']; public function client(){return $this->belongsTo(Client::class);} public function site(){return $this->belongsTo(ClientSite::class);} public function contract(){return $this->belongsTo(Contract::class);} }
