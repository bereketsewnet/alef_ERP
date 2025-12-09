<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientSite;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

class ClientController extends Controller
{
    /**
     * @OA\Get(
     *     path="/clients",
     *     summary="List all clients",
     *     tags={"Clients"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="List of clients")
     * )
     */
    public function index(Request $request)
    {
        $query = Client::with('sites');

        // Search by company name, contact person, or phone (case-insensitive)
        if ($request->has('search')) {
            $searchTerm = strtolower($request->search);
            $query->where(function($q) use ($searchTerm) {
                $q->whereRaw('LOWER(company_name) like ?', ['%' . $searchTerm . '%'])
                  ->orWhereRaw('LOWER(contact_person) like ?', ['%' . $searchTerm . '%'])
                  ->orWhereRaw('LOWER(contact_phone) like ?', ['%' . $searchTerm . '%']);
            });
        }

        $clients = $query->paginate(50);
        return response()->json($clients);
    }

    /**
     * @OA\Post(
     *     path="/clients",
     *     summary="Create a new client",
     *     tags={"Clients"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"company_name", "contact_person", "contact_phone"},
     *             @OA\Property(property="company_name", type="string"),
     *             @OA\Property(property="contact_person", type="string"),
     *             @OA\Property(property="contact_phone", type="string"),
     *             @OA\Property(property="billing_cycle", type="string"),
     *             @OA\Property(property="tin_number", type="string"),
     *             @OA\Property(property="address_details", type="object")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Client created")
     * )
     */
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

    /**
     * @OA\Get(
     *     path="/clients/{id}",
     *     summary="Get client details",
     *     tags={"Clients"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Client details")
     * )
     */
    public function show($id)
    {
        return response()->json(Client::with('sites')->findOrFail($id));
    }

    /**
     * @OA\Put(
     *     path="/clients/{id}",
     *     summary="Update client details",
     *     tags={"Clients"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="company_name", type="string"),
     *             @OA\Property(property="contact_person", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Client updated")
     * )
     */
    public function update(Request $request, $id)
    {
        $client = Client::findOrFail($id);
        $client->update($request->all());
        return response()->json($client);
    }

    /**
     * @OA\Delete(
     *     path="/clients/{id}",
     *     summary="Delete a client",
     *     tags={"Clients"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Client deleted successfully")
     * )
     */
    public function destroy($id)
    {
        $client = Client::findOrFail($id);
        $client->delete();

        return response()->json([
            'message' => 'Client deleted successfully'
        ]);
    }

    /**
     * @OA\Post(
     *     path="/clients/{clientId}/sites",
     *     summary="Create a site for a client",
     *     tags={"Clients"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="clientId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"site_name", "latitude", "longitude"},
     *             @OA\Property(property="site_name", type="string"),
     *             @OA\Property(property="latitude", type="number", format="float"),
     *             @OA\Property(property="longitude", type="number", format="float"),
     *             @OA\Property(property="radius_meters", type="integer", example=100)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Site created")
     * )
     */
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

    /**
     * @OA\Get(
     *     path="/clients/{clientId}/sites",
     *     summary="Get all sites for a client",
     *     tags={"Clients"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="clientId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="List of sites")
     * )
     */
    public function getSites($clientId)
    {
        $sites = ClientSite::where('client_id', $clientId)->with('requiredJobs')->get();
        return response()->json($sites);
    }

    /**
     * Get jobs required at a specific site
     */
    public function getSiteJobs($siteId)
    {
        $site = ClientSite::findOrFail($siteId);
        $jobs = $site->requiredJobs()->with('category')->get();
        
        return response()->json($jobs);
    }

    /**
     * Add a job requirement to a site
     */
    public function addSiteJob(Request $request, $siteId)
    {
        $site = ClientSite::findOrFail($siteId);
        
        $validated = $request->validate([
            'job_id' => 'required|exists:jobs,id',
            'positions_needed' => 'integer|min:1',
        ]);
        
        // Check if already added
        if ($site->requiresJob($validated['job_id'])) {
            return response()->json(['error' => 'Job already required at this site'], 422);
        }
        
        $site->requiredJobs()->attach($validated['job_id'], [
            'positions_needed' => $validated['positions_needed'] ?? 1,
        ]);
        
        $site->load('requiredJobs.category');
        
        return response()->json([
            'message' => 'Job requirement added to site',
            'site' => $site
        ], 201);
    }

    /**
     * Update job positions needed at a site
     */
    public function updateSiteJob(Request $request, $siteId, $jobId)
    {
        $site = ClientSite::findOrFail($siteId);
        
        if (!$site->requiresJob($jobId)) {
            return response()->json(['error' => 'Job not required at this site'], 404);
        }
        
        $validated = $request->validate([
            'positions_needed' => 'required|integer|min:1',
        ]);
        
        $site->requiredJobs()->updateExistingPivot($jobId, $validated);
        
        return response()->json(['message' => 'Job positions updated']);
    }

    /**
     * Remove a job requirement from a site
     */
    public function removeSiteJob($siteId, $jobId)
    {
        $site = ClientSite::findOrFail($siteId);
        
        if (!$site->requiresJob($jobId)) {
            return response()->json(['error' => 'Job not required at this site'], 404);
        }
        
        $site->requiredJobs()->detach($jobId);
        
        return response()->json(['message' => 'Job requirement removed from site']);
    }
}
