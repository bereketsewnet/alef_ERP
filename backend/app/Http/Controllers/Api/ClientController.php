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
    public function index()
    {
        $clients = Client::with('sites')->paginate(50);
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
        $sites = ClientSite::where('client_id', $clientId)->get();
        return response()->json($sites);
    }
}
