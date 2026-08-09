<?php
namespace Database\Seeders;
use App\Models\{Bid,BidDocument,Client,CrmLead,CrmServiceCategory,User};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class BidDemoSeeder extends Seeder {
 public function run():void {
  $owner=User::where('role','OWNER')->value('id')?:User::value('id');
  $clients=Client::where('company_name','like','CRM DEMO —%')->with('sites')->orderBy('id')->get();
  $cats=CrmServiceCategory::where('is_active',true)->orderBy('id')->get();
  $lead=CrmLead::where('company_name','like','CRM DEMO Lead%')->first();
  if(!$clients->count()||!$cats->count()){$this->call(CrmDemoSeeder::class);$clients=Client::where('company_name','like','CRM DEMO —%')->with('sites')->get();$cats=CrmServiceCategory::where('is_active',true)->get();}
  $statuses=['POTENTIAL','APPLIED','WON','LOST','NOT_ELIGIBLE'];
  foreach($statuses as $i=>$status){$client=$clients[$i%$clients->count()];$cat=$cats[$i%$cats->count()];$bid=Bid::updateOrCreate(['reference_number'=>'BID-DEMO-'.str_pad((string)($i+1),3,'0',STR_PAD_LEFT)],[
   'client_id'=>$i===0?null:$client->id,'site_id'=>$i===0?null:$client->sites->first()?->id,'lead_id'=>$i===0?$lead?->id:null,'category_id'=>$cat->id,
   'title'=>"CRM DEMO {$cat->name} Tender — {$status}",'issuer'=>$i===0?'Public Procurement Authority':$client->company_name,
   'submission_deadline'=>today()->addDays(($i-2)*7),'estimated_value'=>250000+($i*125000),'submitted_value'=>$status==='POTENTIAL'?null:240000+($i*120000),
   'submitted_at'=>in_array($status,['APPLIED','WON','LOST'])?today()->subDays(10-$i):null,'result_date'=>in_array($status,['WON','LOST','NOT_ELIGIBLE'])?today()->subDays($i):null,
   'status'=>$status,'notes'=>"Seeded {$status} variation linked to the CRM-managed {$cat->name} category.",'responsible_user_id'=>$owner,
  ]);
  $this->document($bid,'Tender notice','tender-notice.pdf',$owner);
  if(in_array($status,['APPLIED','WON','LOST'])){$this->document($bid,'Technical proposal','technical-proposal.pdf',$owner);$this->document($bid,'Financial proposal','financial-proposal.pdf',$owner);}
  if(in_array($status,['WON','LOST','NOT_ELIGIBLE']))$this->document($bid,'Result notification','result-notification.pdf',$owner);
  }
  $this->command?->info('Bid demo data seeded: all 5 statuses, CRM categories, client/site links, public tender, and named documents.');
 }
 private function document(Bid $bid,string $name,string $filename,?int $owner):void{$path="bid-documents/{$bid->id}/demo-".str($name)->slug().'.pdf';if(!Storage::disk('local')->exists($path)){$body="BT /F1 12 Tf 50 740 Td (ALEF DELTA ERP BID DEMO - {$name}) Tj 0 -25 Td ({$bid->title}) Tj 0 -25 Td (Reference: {$bid->reference_number}) Tj ET";$pdf="%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length ".strlen($body).">>stream\n{$body}\nendstream endobj\ntrailer<</Root 1 0 R>>\n%%EOF";Storage::disk('local')->put($path,$pdf);} $abs=Storage::disk('local')->path($path);@chmod(dirname(dirname($abs)),0775);@chmod(dirname($abs),0775);@chmod($abs,0664);BidDocument::updateOrCreate(['bid_id'=>$bid->id,'name'=>$name],['path'=>$path,'original_name'=>$filename,'mime_type'=>'application/pdf','size_bytes'=>Storage::disk('local')->size($path),'uploaded_by'=>$owner]);}
}
