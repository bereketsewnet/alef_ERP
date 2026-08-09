<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\CrmContractDocument;
use App\Models\CrmCustomerIssue;
use App\Models\CrmServiceCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CrmContractController extends Controller
{
    private function contractQuery()
    {
        return Contract::with(['client:id,company_name,contact_person,contact_phone,email', 'site:id,client_id,site_name', 'categories', 'documents'])
            ->withCount('issues');
    }

    public function dashboard()
    {
        $active = Contract::where('status', 'ACTIVE')->whereNull('archived_at');
        $contracts = (clone $active)->get();
        return response()->json([
            'clients' => \App\Models\Client::count(),
            'sites' => \App\Models\ClientSite::count(),
            'active_contracts' => $contracts->count(),
            'expiring_30_days' => $contracts->filter(fn($c) => $c->days_remaining >= 0 && $c->days_remaining <= 30)->count(),
            'expired' => Contract::where(fn($q) => $q->where('status','EXPIRED')->orWhere(fn($x) => $x->where('end_date','<',today())->where('status','!=','TERMINATED')))->count(),
            'open_issues' => CrmCustomerIssue::whereNotIn('status', ['RESOLVED','CLOSED'])->count(),
            'urgent' => $this->contractQuery()->where('status','ACTIVE')->whereNull('archived_at')->whereDate('end_date','<=',today()->addDays(30))->orderBy('end_date')->get(),
        ]);
    }

    public function index(Request $request)
    {
        $q = $this->contractQuery();
        if ($request->boolean('archived')) $q->whereNotNull('archived_at'); else $q->whereNull('archived_at');
        if ($request->filled('client_id')) $q->where('client_id', $request->integer('client_id'));
        if ($request->filled('site_id')) $q->where('site_id', $request->integer('site_id'));
        if ($request->filled('status')) $q->where('status', $request->status);
        if ($request->filled('category_id')) $q->whereHas('categories', fn($x) => $x->where('crm_service_categories.id', $request->integer('category_id')));
        if ($request->filled('search')) { $s=$request->search; $q->where(fn($x)=>$x->where('title','like',"%$s%")->orWhere('reference_number','like',"%$s%")); }
        return response()->json($q->orderBy('end_date')->paginate(min($request->integer('per_page', 25), 100)));
    }

    private function validateContract(Request $request, bool $update = false): array
    {
        $sometimes = $update ? 'sometimes|' : '';
        return $request->validate([
            'client_id' => $sometimes.'required|exists:clients,id',
            'site_id' => 'nullable|exists:client_sites,id',
            'title' => $sometimes.'required|string|max:255',
            'reference_number' => 'nullable|string|max:100',
            'start_date' => $sometimes.'required|date',
            'end_date' => $sometimes.'required|date|after_or_equal:start_date',
            'status' => 'nullable|in:DRAFT,ACTIVE,EXPIRED,TERMINATED',
            'contract_amount' => 'nullable|numeric|min:0',
            'payment_frequency' => 'nullable|in:MONTHLY,QUARTERLY,ANNUAL,ONE_TIME,OTHER',
            'payment_due_day' => 'nullable|integer|between:1,31',
            'expiry_reminder_days' => 'nullable|integer|between:1,365',
            'reminder_email' => 'nullable|email|max:255',
            'agreement_summary' => 'nullable|string|max:10000',
            'payment_terms' => 'nullable|string|max:10000',
            'category_ids' => $sometimes.'required|array|min:1',
            'category_ids.*' => 'integer|exists:crm_service_categories,id',
            'document_names' => 'nullable|array', 'document_names.*' => 'nullable|string|max:255',
            'documents' => 'nullable|array|max:20', 'documents.*' => 'file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,rtf,csv,txt,jpg,jpeg,jfif,png,webp,avif,gif,bmp,heic,heif,zip|max:51200',
        ]);
    }

    public function store(Request $request)
    {
        $v=$this->validateContract($request);
        $this->validateSiteClient($v);
        $contract=DB::transaction(function() use($request,$v){
            $c=Contract::create(collect($v)->except(['category_ids','documents','document_names'])->merge(['created_by'=>Auth::id(),'status'=>$v['status']??'ACTIVE'])->all());
            $c->categories()->sync($v['category_ids']); $this->saveDocuments($request,$c); return $c;
        });
        return response()->json(['data'=>$this->contractQuery()->findOrFail($contract->id)],201);
    }

    public function update(Request $request, int $id)
    {
        $c=Contract::findOrFail($id); $v=$this->validateContract($request,true); $this->validateSiteClient(array_merge($c->toArray(),$v));
        $c->update(collect($v)->except(['category_ids','documents','document_names'])->all());
        if(isset($v['category_ids'])) $c->categories()->sync($v['category_ids']); $this->saveDocuments($request,$c);
        return response()->json(['data'=>$this->contractQuery()->findOrFail($id)]);
    }

    private function validateSiteClient(array $v): void
    {
        if (!empty($v['site_id']) && !\App\Models\ClientSite::where('id',$v['site_id'])->where('client_id',$v['client_id'])->exists()) abort(422,'Selected site does not belong to the selected client.');
    }

    private function saveDocuments(Request $request, Contract $contract): void
    {
        foreach($request->file('documents',[]) as $i=>$file){
            $path=$file->storeAs('crm-contracts/'.$contract->id,Str::uuid().'.'.strtolower($file->getClientOriginalExtension()),'local');
            $contract->documents()->create(['name'=>$request->input("document_names.$i") ?: pathinfo($file->getClientOriginalName(),PATHINFO_FILENAME),'path'=>$path,'original_name'=>$file->getClientOriginalName(),'mime_type'=>$file->getMimeType(),'size_bytes'=>$file->getSize(),'uploaded_by'=>Auth::id()]);
        }
    }

    public function terminate(Request $request,int $id){$v=$request->validate(['reason'=>'required|string|max:5000']);$c=Contract::findOrFail($id);$c->update(['status'=>'TERMINATED','termination_reason'=>$v['reason'],'terminated_at'=>now(),'terminated_by'=>Auth::id(),'archived_at'=>now()]);return response()->json(['message'=>'Contract terminated and archived.']);}
    public function archive(int $id){Contract::findOrFail($id)->update(['archived_at'=>now()]);return response()->json(['message'=>'Contract archived.']);}
    public function restore(int $id){$c=Contract::findOrFail($id);$c->update(['archived_at'=>null,'status'=>$c->end_date->isPast()?'EXPIRED':'ACTIVE']);return response()->json(['message'=>'Contract restored.']);}
    public function downloadDocument(int $id){$d=CrmContractDocument::findOrFail($id);$absolute=Storage::disk('local')->path($d->getRawOriginal('path'));abort_unless(is_file($absolute),404,'Contract document file not found.');return response()->download($absolute,$d->original_name,['Content-Type'=>$d->mime_type?:'application/octet-stream']);}
    public function renameDocument(Request $request,int $id){$v=$request->validate(['name'=>'required|string|max:255']);$d=CrmContractDocument::findOrFail($id);$d->update($v);return response()->json(['data'=>$d]);}
    public function deleteDocument(int $id){$d=CrmContractDocument::findOrFail($id);Storage::disk('local')->delete($d->path);$d->delete();return response()->json(['message'=>'Document deleted.']);}

    public function categories(){return response()->json(CrmServiceCategory::orderBy('name')->get());}
    public function storeCategory(Request $r){$v=$r->validate(['name'=>'required|string|max:100|unique:crm_service_categories,name','description'=>'nullable|string']);return response()->json(CrmServiceCategory::create($v),201);}
    public function updateCategory(Request $r,int $id){$c=CrmServiceCategory::findOrFail($id);$v=$r->validate(['name'=>['sometimes','required','string','max:100',Rule::unique('crm_service_categories')->ignore($id)],'description'=>'nullable|string','is_active'=>'nullable|boolean']);$c->update($v);return response()->json($c);}

    public function issues(Request $r){$q=CrmCustomerIssue::with(['client:id,company_name','site:id,site_name','contract:id,title'])->latest();if($r->filled('client_id'))$q->where('client_id',$r->integer('client_id'));if($r->filled('status'))$q->where('status',$r->status);return response()->json($q->paginate(50));}
    public function storeIssue(Request $r){$v=$r->validate(['client_id'=>'required|exists:clients,id','site_id'=>'nullable|exists:client_sites,id','contract_id'=>'nullable|exists:contracts,id','subject'=>'required|string|max:255','description'=>'required|string|max:10000','priority'=>'required|in:LOW,MEDIUM,HIGH,URGENT']);$v['created_by']=Auth::id();return response()->json(['data'=>CrmCustomerIssue::create($v)->load(['client','site','contract'])],201);}
    public function updateIssue(Request $r,int $id){$i=CrmCustomerIssue::findOrFail($id);$v=$r->validate(['status'=>'sometimes|in:OPEN,IN_PROGRESS,RESOLVED,CLOSED','action_taken'=>'nullable|string|max:10000','priority'=>'sometimes|in:LOW,MEDIUM,HIGH,URGENT']);if(($v['status']??null)==='RESOLVED'){$v['resolved_at']=now();$v['resolved_by']=Auth::id();}$i->update($v);return response()->json(['data'=>$i->fresh(['client','site','contract'])]);}

    public function exportCsv(Request $r)
    {
        $rows=$this->contractQuery()->whereNull('archived_at')->get();
        return response()->streamDownload(function()use($rows){$o=fopen('php://output','w');fputcsv($o,['Client','Site','Contract','Reference','Services','Start','End','Days Remaining','Status','Amount','Open Issues']);foreach($rows as $c)fputcsv($o,[$c->client?->company_name,$c->site?->site_name,$c->title,$c->reference_number,$c->categories->pluck('name')->join(', '),$c->start_date?->toDateString(),$c->end_date?->toDateString(),$c->days_remaining,$c->status,$c->contract_amount,$c->issues_count]);fclose($o);},'crm-contract-report-'.today()->toDateString().'.csv',['Content-Type'=>'text/csv']);
    }
}
