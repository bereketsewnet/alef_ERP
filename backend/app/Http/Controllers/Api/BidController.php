<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bid;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\BidDocument;

class BidController extends Controller
{
    /**
     * List bids with simple filters (status, search).
     */
    public function index(Request $request)
    {
        $query = Bid::with(['client', 'site', 'lead', 'responsible', 'category', 'documents']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($request->filled('category_id')) $query->where('category_id', $request->integer('category_id'));
        if ($request->filled('client_id')) $query->where('client_id', $request->integer('client_id'));

        if ($search = $request->input('search')) {
            $search = strtolower($search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(title) like ?', ['%' . $search . '%'])
                    ->orWhereRaw('LOWER(reference_number) like ?', ['%' . $search . '%'])
                    ->orWhereRaw('LOWER(issuer) like ?', ['%' . $search . '%']);
            });
        }

        $perPage = $request->input('per_page', 20);

        return response()->json($query->latest()->paginate($perPage));
    }

    /**
     * Store a new bid.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'reference_number' => 'nullable|string|max:255',
            'issuer' => 'nullable|string|max:255',
            'submission_deadline' => 'nullable|date',
            'estimated_value' => 'nullable|numeric',
            'submitted_value' => 'nullable|numeric',
            'submitted_at' => 'nullable|date',
            'result_date' => 'nullable|date',
            'status' => 'nullable|in:POTENTIAL,APPLIED,WON,LOST,NOT_ELIGIBLE',
            'notes' => 'nullable|string',
            'client_id' => 'nullable|exists:clients,id',
            'lead_id' => 'nullable|exists:crm_leads,id',
            'site_id' => 'nullable|exists:client_sites,id',
            'category_id' => 'required|exists:crm_service_categories,id',
            'document_names' => 'nullable|array', 'document_names.*' => 'nullable|string|max:255',
            'documents' => 'nullable|array|max:20', 'documents.*' => 'file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,rtf,csv,txt,jpg,jpeg,jfif,png,webp,avif,gif,bmp,heic,heif,zip|max:51200',
        ]);

        $this->validateSiteClient($validated);

        $validated['responsible_user_id'] = Auth::id();

        $bid = Bid::create(collect($validated)->except(['documents','document_names'])->all());
        $this->saveDocuments($request, $bid);

        return response()->json(['data' => $bid->fresh(['client', 'site', 'lead', 'responsible', 'category', 'documents'])], 201);
    }

    /**
     * Show a single bid.
     */
    public function show($id)
    {
        $bid = Bid::with(['client', 'site', 'lead', 'responsible', 'category', 'documents'])->find($id);

        if (!$bid) {
            return response()->json(['message' => 'Bid not found'], 404);
        }

        return response()->json(['data' => $bid]);
    }

    /**
     * Update a bid.
     */
    public function update(Request $request, $id)
    {
        $bid = Bid::find($id);

        if (!$bid) {
            return response()->json(['message' => 'Bid not found'], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'reference_number' => 'nullable|string|max:255',
            'issuer' => 'nullable|string|max:255',
            'submission_deadline' => 'nullable|date',
            'estimated_value' => 'nullable|numeric',
            'submitted_value' => 'nullable|numeric',
            'submitted_at' => 'nullable|date',
            'result_date' => 'nullable|date',
            'status' => 'nullable|in:POTENTIAL,APPLIED,WON,LOST,NOT_ELIGIBLE',
            'notes' => 'nullable|string',
            'client_id' => 'nullable|exists:clients,id',
            'lead_id' => 'nullable|exists:crm_leads,id',
            'site_id' => 'nullable|exists:client_sites,id',
            'category_id' => 'sometimes|required|exists:crm_service_categories,id',
            'document_names' => 'nullable|array', 'document_names.*' => 'nullable|string|max:255',
            'documents' => 'nullable|array|max:20', 'documents.*' => 'file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,rtf,csv,txt,jpg,jpeg,jfif,png,webp,avif,gif,bmp,heic,heif,zip|max:51200',
        ]);

        $this->validateSiteClient(array_merge($bid->toArray(),$validated));
        $bid->update(collect($validated)->except(['documents','document_names'])->all());
        $this->saveDocuments($request, $bid);

        return response()->json(['data' => $bid->fresh(['client', 'site', 'lead', 'responsible', 'category', 'documents'])]);
    }

    /**
     * Delete a bid.
     */
    public function destroy($id)
    {
        $bid = Bid::find($id);

        if (!$bid) {
            return response()->json(['message' => 'Bid not found'], 404);
        }

        $bid->delete();

        return response()->json(['message' => 'Bid deleted successfully']);
    }

    private function validateSiteClient(array $data): void
    {
        if (!empty($data['site_id']) && (empty($data['client_id']) || !\App\Models\ClientSite::where('id',$data['site_id'])->where('client_id',$data['client_id'])->exists())) abort(422,'Selected site does not belong to the selected client.');
    }

    private function saveDocuments(Request $request, Bid $bid): void
    {
        foreach ($request->file('documents',[]) as $i=>$file) {
            $path=$file->storeAs('bid-documents/'.$bid->id,Str::uuid().'.'.strtolower($file->getClientOriginalExtension()),'local');
            $bid->documents()->create(['name'=>$request->input("document_names.$i")?:pathinfo($file->getClientOriginalName(),PATHINFO_FILENAME),'path'=>$path,'original_name'=>$file->getClientOriginalName(),'mime_type'=>$file->getMimeType(),'size_bytes'=>$file->getSize(),'uploaded_by'=>Auth::id()]);
        }
    }

    public function downloadDocument(int $id){$d=BidDocument::findOrFail($id);$absolute=Storage::disk('local')->path($d->getRawOriginal('path'));abort_unless(is_file($absolute),404,'Bid document file not found.');return response()->download($absolute,$d->original_name,['Content-Type'=>$d->mime_type?:'application/octet-stream']);}
    public function renameDocument(Request $request,int $id){$v=$request->validate(['name'=>'required|string|max:255']);$d=BidDocument::findOrFail($id);$d->update($v);return response()->json(['data'=>$d]);}
    public function deleteDocument(int $id){$d=BidDocument::findOrFail($id);Storage::disk('local')->delete($d->getRawOriginal('path'));$d->delete();return response()->json(['message'=>'Bid document deleted.']);}
}

