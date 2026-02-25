<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bid;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BidController extends Controller
{
    /**
     * List bids with simple filters (status, search).
     */
    public function index(Request $request)
    {
        $query = Bid::with(['client', 'lead', 'responsible']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

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
            'status' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'client_id' => 'nullable|exists:clients,id',
            'lead_id' => 'nullable|exists:crm_leads,id',
        ]);

        $validated['responsible_user_id'] = Auth::id();

        $bid = Bid::create($validated);

        return response()->json(['data' => $bid->fresh(['client', 'lead', 'responsible'])], 201);
    }

    /**
     * Show a single bid.
     */
    public function show($id)
    {
        $bid = Bid::with(['client', 'lead', 'responsible'])->find($id);

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
            'status' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'client_id' => 'nullable|exists:clients,id',
            'lead_id' => 'nullable|exists:crm_leads,id',
        ]);

        $bid->update($validated);

        return response()->json(['data' => $bid->fresh(['client', 'lead', 'responsible'])]);
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
}

