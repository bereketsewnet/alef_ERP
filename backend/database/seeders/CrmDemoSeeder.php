<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\ClientSite;
use App\Models\Contract;
use App\Models\CrmActivity;
use App\Models\CrmContractDocument;
use App\Models\CrmCustomerIssue;
use App\Models\CrmLead;
use App\Models\CrmServiceCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class CrmDemoSeeder extends Seeder
{
    public function run(): void
    {
        $ownerId = User::where('role', 'OWNER')->value('id') ?: User::value('id');
        $categories = collect([
            'Guard' => 'Security guards and access control',
            'Cleaner' => 'Commercial cleaning services',
            'Driver' => 'Professional driver services',
            'Messenger' => 'Document and parcel messenger services',
            'Receptionist' => 'Front desk and visitor support',
        ])->mapWithKeys(fn ($description, $name) => [
            $name => CrmServiceCategory::updateOrCreate(['name' => $name], ['description' => $description, 'is_active' => true]),
        ]);

        $clientSpecs = [
            ['CRM DEMO — Blue Nile Bank', 'Aster Bekele', '+251911100101', 'crm-blue-nile@example.com', 'Banking client used to test urgent renewal and monthly payment reminders.', 5, 2],
            ['CRM DEMO — Sunrise Hotel', 'Dawit Alemu', '+251911100102', 'crm-sunrise@example.com', 'Hospitality client used to test multi-service and warning contracts.', 10, 5],
            ['CRM DEMO — Unity Manufacturing', 'Marta Tadesse', '+251911100103', 'crm-unity@example.com', 'Manufacturing client used to test expired contracts and unresolved issues.', 15, 3],
            ['CRM DEMO — Green Logistics', 'Samuel Girma', '+251911100104', 'crm-logistics@example.com', 'Logistics client used to test terminated and archived contracts.', 23, 2],
        ];

        $clients = [];
        foreach ($clientSpecs as [$name,$contact,$phone,$email,$description,$dueDay,$grace]) {
            $client = Client::updateOrCreate(['company_name' => $name], [
                'contact_person' => $contact, 'contact_phone' => $phone, 'email' => $email,
                'description' => $description, 'billing_cycle' => 'MONTHLY', 'payment_due_day' => $dueDay,
                'payment_grace_days' => $grace, 'late_penalty_type' => 'PERCENTAGE',
                'late_penalty_value' => 5, 'late_penalty_recurring' => true, 'tin_number' => 'CRM-DEMO-'.substr(md5($name),0,8),
            ]);
            $sites = [];
            foreach ([['Head Office', 9.0300, 38.7469], ['Branch / Operations Site', 9.0400, 38.7569]] as $i => [$siteName,$lat,$lng]) {
                $sites[] = ClientSite::updateOrCreate(['client_id'=>$client->id,'site_name'=>$siteName], [
                    'description' => 'CRM demonstration site '.($i+1), 'latitude'=>$lat + count($clients)*.01,
                    'longitude'=>$lng + count($clients)*.01, 'geo_radius_meters'=>150,
                    'site_contact_phone'=>$phone, 'email'=>$email,
                ]);
            }
            $clients[] = ['client'=>$client,'sites'=>$sites];
        }

        $contracts = [
            ['CRM-DEMO-NORMAL','Annual Security Coverage',$clients[0],0,-90,180,'ACTIVE',125000,'MONTHLY',5,30,['Guard'],'Normal active contract with more than one month remaining.'],
            ['CRM-DEMO-WARNING','Hotel Integrated Services',$clients[1],0,-200,21,'ACTIVE',285000,'MONTHLY',10,30,['Guard','Cleaner','Receptionist'],'Warning example with multiple services and 21 days remaining.'],
            ['CRM-DEMO-URGENT','Branch Guard Renewal',$clients[0],1,-360,5,'ACTIVE',98000,'MONTHLY',5,30,['Guard'],'Urgent example expiring in five days.'],
            ['CRM-DEMO-TODAY','Messenger Agreement',$clients[3],0,-30,0,'ACTIVE',45000,'MONTHLY',23,30,['Messenger'],'Critical example expiring today.'],
            ['CRM-DEMO-EXPIRED','Factory Cleaning Contract',$clients[2],1,-400,-12,'EXPIRED',175000,'QUARTERLY',15,30,['Cleaner'],'Expired example requiring renewal or closure.'],
            ['CRM-DEMO-DRAFT','Proposed Driver Service',$clients[3],1,7,370,'DRAFT',72000,'MONTHLY',23,60,['Driver'],'Draft future agreement.'],
            ['CRM-DEMO-TERMINATED','Terminated Mixed Service',$clients[3],0,-300,100,'TERMINATED',210000,'MONTHLY',23,30,['Driver','Messenger'],'Terminated contract retained in archive.'],
            ['CRM-DEMO-ARCHIVED','Completed Historical Contract',$clients[1],1,-700,-335,'EXPIRED',150000,'ANNUAL',10,30,['Guard','Cleaner'],'Archived historical contract available for restore testing.'],
        ];

        $createdContracts = [];
        foreach ($contracts as [$ref,$title,$bundle,$siteIndex,$startOffset,$endOffset,$status,$amount,$frequency,$dueDay,$reminderDays,$serviceNames,$summary]) {
            $isArchived = in_array($ref, ['CRM-DEMO-TERMINATED','CRM-DEMO-ARCHIVED']);
            $contract = Contract::updateOrCreate(['reference_number'=>$ref], [
                'client_id'=>$bundle['client']->id, 'site_id'=>$bundle['sites'][$siteIndex]->id, 'title'=>$title,
                'start_date'=>today()->addDays($startOffset), 'end_date'=>today()->addDays($endOffset), 'status'=>$status,
                'contract_amount'=>$amount, 'payment_frequency'=>$frequency, 'payment_due_day'=>$dueDay,
                'expiry_reminder_days'=>$reminderDays, 'reminder_email'=>$bundle['client']->email,
                'agreement_summary'=>$summary, 'payment_terms'=>"Payment due on day {$dueDay}. Five percent recurring late penalty applies after the client's grace period.",
                'termination_reason'=>$status==='TERMINATED'?'Demo termination: repeated service-scope changes by mutual agreement.':null,
                'terminated_at'=>$status==='TERMINATED'?now()->subDays(3):null, 'terminated_by'=>$status==='TERMINATED'?$ownerId:null,
                'archived_at'=>$isArchived?now()->subDays(2):null, 'created_by'=>$ownerId,
            ]);
            $contract->categories()->sync(collect($serviceNames)->map(fn($name)=>$categories[$name]->id));
            $this->addSampleDocument($contract, 'Signed agreement', 'signed-agreement.pdf', $ownerId);
            if (count($serviceNames)>1) $this->addSampleDocument($contract, 'Service schedule and pricing', 'service-schedule.pdf', $ownerId);
            $createdContracts[$ref]=$contract;
        }

        $issueSpecs = [
            [$clients[0],$createdContracts['CRM-DEMO-URGENT'],'URGENT','OPEN','Guard replacement required immediately','Night-shift guard did not report. Client requests replacement before 18:00.',null],
            [$clients[1],$createdContracts['CRM-DEMO-WARNING'],'HIGH','IN_PROGRESS','Cleaning quality discussion','Client reported incomplete lobby cleaning. Operations is reviewing CCTV and duty roster.','Site supervisor contacted; corrective cleaning scheduled.'],
            [$clients[2],$createdContracts['CRM-DEMO-EXPIRED'],'MEDIUM','RESOLVED','Uniform compliance complaint','Two assigned employees were not wearing complete uniforms.','Uniforms replaced and supervisor confirmed compliance.'],
            [$clients[3],$createdContracts['CRM-DEMO-DRAFT'],'LOW','CLOSED','Requested contract wording change','Client requested clarification of fuel responsibility.','Draft payment and fuel clause updated.'],
        ];
        foreach ($issueSpecs as [$bundle,$contract,$priority,$status,$subject,$description,$action]) {
            CrmCustomerIssue::updateOrCreate(['client_id'=>$bundle['client']->id,'subject'=>$subject], [
                'site_id'=>$bundle['sites'][0]->id,'contract_id'=>$contract->id,'description'=>$description,
                'priority'=>$priority,'status'=>$status,'action_taken'=>$action,'created_by'=>$ownerId,
                'resolved_at'=>in_array($status,['RESOLVED','CLOSED'])?now()->subDay():null,
                'resolved_by'=>in_array($status,['RESOLVED','CLOSED'])?$ownerId:null,
            ]);
        }

        foreach (['REACH','QUALIFIED','PROPOSAL','NEGOTIATION','CLOSED_WON','CLOSED_LOST'] as $i=>$stage) {
            $lead=CrmLead::updateOrCreate(['company_name'=>"CRM DEMO Lead — {$stage}"], [
                'contact_person'=>'Demo Contact '.($i+1),'contact_phone'=>'+25192220010'.($i+1),
                'email'=>'crm-lead-'.strtolower($stage).'@example.com','source'=>['Referral','Website','Cold Call','Tender','Existing Client','LinkedIn'][$i],
                'stage'=>$stage,'expected_value'=>50000+($i*25000),'probability'=>[10,25,50,75,100,0][$i],
                'next_action_date'=>today()->addDays($i-2),'next_action_note'=>'Demo follow-up for '.$stage,
                'notes'=>'Seeded lead covering the '.$stage.' pipeline variation.','created_by'=>$ownerId,
            ]);
            CrmActivity::updateOrCreate(['lead_id'=>$lead->id,'subject'=>'Initial CRM demo activity'], [
                'type'=>['CALL','EMAIL','MEETING','TASK','NOTE','CALL'][$i], 'description'=>'Sample discussion and follow-up history.',
                'due_at'=>today()->addDays($i), 'completed_at'=>$i<3?now()->subDays(3-$i):null, 'created_by'=>$ownerId,
            ]);
        }

        $this->command?->info('CRM demo data seeded: 4 clients, 8 sites, 8 contract variations, 4 issue variations, 6 lead stages, and sample documents.');
    }

    private function addSampleDocument(Contract $contract, string $name, string $filename, ?int $ownerId): void
    {
        $path="crm-contracts/{$contract->id}/demo-".str($name)->slug().'.pdf';
        if (!Storage::disk('local')->exists($path)) {
            $text="ALEF DELTA ERP CRM DEMO DOCUMENT\n\n{$name}\nContract: {$contract->title}\nReference: {$contract->reference_number}\nThis is a generated test attachment. Replace it with the signed source document during real use.";
            $escaped=str_replace(['\\','(',')'],['\\\\','\\(','\\)'],$text);
            $stream="BT /F1 12 Tf 50 760 Td (".str_replace("\n",') Tj 0 -20 Td (',$escaped).") Tj ET";
            $pdf="%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length ".strlen($stream).">>stream\n{$stream}\nendstream endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
            Storage::disk('local')->put($path,$pdf);
        }
        // CLI seeding runs as root in Docker; allow Apache (www-data) to serve the private file through the authenticated controller.
        $absolute = Storage::disk('local')->path($path);
        @chmod(dirname(dirname($absolute)), 0775);
        @chmod(dirname($absolute), 0775);
        @chmod($absolute, 0664);
        CrmContractDocument::updateOrCreate(['contract_id'=>$contract->id,'name'=>$name], [
            'path'=>$path,'original_name'=>$filename,'mime_type'=>'application/pdf','size_bytes'=>Storage::disk('local')->size($path),'uploaded_by'=>$ownerId,
        ]);
    }
}
