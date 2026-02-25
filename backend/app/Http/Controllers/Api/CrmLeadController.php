<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmLead;
use App\Models\CrmActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CrmLeadController extends Controller
{
    /**
     * List CRM leads with simple filters (stage, search).
     */
    public function index(Request $request)
    {
        $query = CrmLead::with(['client', 'assignedTo']);

        if ($stage = $request->input('stage')) {
            $query->where('stage', $stage);
        }

        if ($search = $request->input('search')) {
            $search = strtolower($search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(company_name) like ?', ['%' . $search . '%'])
                    ->orWhereRaw('LOWER(contact_person) like ?', ['%' . $search . '%'])
                    ->orWhereRaw('LOWER(contact_phone) like ?', ['%' . $search . '%'])
                    ->orWhereRaw('LOWER(email) like ?', ['%' . $search . '%']);
            });
        }

        $perPage = $request->input('per_page', 20);

        return response()->json($query->latest()->paginate($perPage));
    }

    /**
     * Store a new lead.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'source' => 'nullable|string|max:255',
            'stage' => 'nullable|string|max:50',
            'expected_value' => 'nullable|numeric',
            'probability' => 'nullable|integer|min:0|max:100',
            'next_action_date' => 'nullable|date',
            'next_action_note' => 'nullable|string',
            'notes' => 'nullable|string',
            'client_id' => 'nullable|exists:clients,id',
        ]);

        $validated['created_by'] = Auth::id();

        $lead = CrmLead::create($validated);

        return response()->json(['data' => $lead->fresh(['client', 'assignedTo'])], 201);
    }

    /**
     * Show a single lead with activities.
     */
    public function show($id)
    {
        $lead = CrmLead::with(['client', 'assignedTo', 'activities.creator'])->find($id);

        if (!$lead) {
            return response()->json(['message' => 'Lead not found'], 404);
        }

        return response()->json(['data' => $lead]);
    }

    /**
     * Update a lead.
     */
    public function update(Request $request, $id)
    {
        $lead = CrmLead::find($id);

        if (!$lead) {
            return response()->json(['message' => 'Lead not found'], 404);
        }

        $validated = $request->validate([
            'company_name' => 'sometimes|required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'source' => 'nullable|string|max:255',
            'stage' => 'nullable|string|max:50',
            'expected_value' => 'nullable|numeric',
            'probability' => 'nullable|integer|min:0|max:100',
            'next_action_date' => 'nullable|date',
            'next_action_note' => 'nullable|string',
            'notes' => 'nullable|string',
            'client_id' => 'nullable|exists:clients,id',
        ]);

        $lead->update($validated);

        return response()->json(['data' => $lead->fresh(['client', 'assignedTo'])]);
    }

    /**
     * Delete a lead.
     */
    public function destroy($id)
    {
        $lead = CrmLead::find($id);

        if (!$lead) {
            return response()->json(['message' => 'Lead not found'], 404);
        }

        $lead->delete();

        return response()->json(['message' => 'Lead deleted successfully']);
    }

    /**
     * Add an activity (call/email/meeting/note/task) to a lead.
     */
    public function addActivity(Request $request, $leadId)
    {
        $lead = CrmLead::find($leadId);

        if (!$lead) {
            return response()->json(['message' => 'Lead not found'], 404);
        }

        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'subject' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'due_at' => 'nullable|date',
            'completed_at' => 'nullable|date',
        ]);

        $validated['lead_id'] = $lead->id;
        $validated['created_by'] = Auth::id();

        $activity = CrmActivity::create($validated);

        // Update last_contacted_at & next_action for quick pipeline view
        if ($validated['completed_at'] ?? null) {
            $lead->last_contacted_at = $validated['completed_at'];
        } else {
            $lead->last_contacted_at = now();
        }
        if ($validated['due_at'] ?? null) {
            $lead->next_action_date = $validated['due_at'];
            $lead->next_action_note = $validated['subject'] ?? $lead->next_action_note;
        }
        $lead->save();

        return response()->json(['data' => $activity->load('creator')], 201);
    }
}

