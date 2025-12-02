<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientSite;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index()
    {
        $clients = Client::with('sites')->paginate(50);
        return response()->json($clients);
    }

    public function store(Request $request)
    {
        $request->validate([
            'company_name' => 'required|string',
            'contact_person' => 'required|string',
            'contact_phone' => 'required|string',
            'billing_cycle' => 'sometimes|string',
            'tin_number' => 'nullable|string',
            'address_details' => 'nullable|array',
        ]);

        $client = Client::create($request->all());

        return response()->json($client, 201);
    }

    public function show($id)
    {
        $client = Client::with(['sites', 'contracts'])->findOrFail($id);
        return response()->json($client);
    }

    public function update(Request $request, $id)
    {
        $client = Client::findOrFail($id);
        $client->update($request->all());

        return response()->json($client);
    }

    public function createSite(Request $request, $clientId)
    {
        $request->validate([
            'site_name' => 'required|string',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'geo_radius_meters' => 'sometimes|integer|min:10',
            'site_contact_phone' => 'nullable|string',
        ]);

        $client = Client::findOrFail($clientId);

        $site = $client->sites()->create($request->all());

        return response()->json($site, 201);
    }

    public function getSites($clientId)
    {
        $sites = ClientSite::where('client_id', $clientId)->get();
        return response()->json($sites);
    }
}
