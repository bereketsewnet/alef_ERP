<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AssetService;
use App\Models\Asset;
use App\Models\AssetAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Annotations as OA;

class AssetController extends Controller
{
    private AssetService $assetService;

    public function __construct(AssetService $assetService)
    {
        $this->assetService = $assetService;
    }

    /**
     * @OA\Get(
     *     path="/assets",
     *     summary="List all assets with search and filters",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="category", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="condition", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="status", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="List of assets")
     * )
     */
    public function index(Request $request)
    {
        $query = Asset::with(['currentAssignment.employee']);

        // Search by asset_code, name, or category
        if ($request->has('search') && $request->search) {
            $query->search($request->search);
        }

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Filter by condition
        if ($request->has('condition') && $request->condition) {
            $query->where('condition', $request->condition);
        }

        // Filter by status (assigned/available)
        if ($request->has('status')) {
            if ($request->status === 'assigned') {
                $query->assigned();
            } elseif ($request->status === 'available') {
                $query->available();
            }
        }

        return response()->json($query->paginate(50));
    }

    /**
     * @OA\Get(
     *     path="/assets/{id}",
     *     summary="Get asset details with assignment history",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Asset details")
     * )
     */
    public function show($id)
    {
        $asset = Asset::with(['currentAssignment.employee', 'assignments.employee', 'assignments.assignedBy', 'assignments.returnedBy'])
            ->findOrFail($id);

        return response()->json($asset);
    }

    /**
     * @OA\Post(
     *     path="/assets",
     *     summary="Create a new asset",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"asset_code", "name", "category"},
     *             @OA\Property(property="asset_code", type="string"),
     *             @OA\Property(property="name", type="string"),
     *             @OA\Property(property="category", type="string"),
     *             @OA\Property(property="description", type="string"),
     *             @OA\Property(property="purchase_date", type="string", format="date"),
     *             @OA\Property(property="value", type="number", format="float")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Asset created")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'asset_code' => 'required|string|unique:assets',
            'name' => 'required|string',
            'category' => 'required|string',
            'description' => 'nullable|string',
            'purchase_date' => 'nullable|date',
            'value' => 'nullable|numeric',
            'condition' => 'nullable|in:NEW,GOOD,DAMAGED,LOST',
        ]);

        // Set default condition if not provided
        if (!isset($validated['condition'])) {
            $validated['condition'] = 'NEW';
        }

        $asset = Asset::create($validated);

        return response()->json($asset, 201);
    }

    /**
     * @OA\Put(
     *     path="/assets/{id}",
     *     summary="Update an asset",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent()),
     *     @OA\Response(response=200, description="Asset updated")
     * )
     */
    public function update(Request $request, $id)
    {
        $asset = Asset::findOrFail($id);

        $validated = $request->validate([
            'asset_code' => 'sometimes|string|unique:assets,asset_code,' . $id,
            'name' => 'sometimes|string',
            'category' => 'sometimes|string',
            'description' => 'nullable|string',
            'purchase_date' => 'nullable|date',
            'value' => 'nullable|numeric',
            'condition' => 'sometimes|in:NEW,GOOD,DAMAGED,LOST',
        ]);

        $asset->update($validated);

        return response()->json($asset);
    }

    /**
     * @OA\Delete(
     *     path="/assets/{id}",
     *     summary="Delete an asset",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=204, description="Asset deleted")
     * )
     */
    public function destroy($id)
    {
        $asset = Asset::findOrFail($id);
        
        // Check if asset is currently assigned
        if ($asset->currentAssignment) {
            return response()->json(['error' => 'Cannot delete an asset that is currently assigned'], 400);
        }

        $asset->delete();

        return response()->json(null, 204);
    }

    /**
     * @OA\Post(
     *     path="/assets/{id}/assign",
     *     summary="Assign asset to employee",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"employee_id"},
     *             @OA\Property(property="employee_id", type="integer"),
     *             @OA\Property(property="notes", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Asset assigned")
     * )
     */
    public function assign(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'notes' => 'nullable|string',
            ]);

            $assignment = $this->assetService->assignAsset(
                $id,
                $validated['employee_id'],
                $validated['notes'] ?? null,
                Auth::id()
            );

            return response()->json($assignment->load(['asset', 'employee']));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * @OA\Post(
     *     path="/assets/{id}/return",
     *     summary="Return an asset",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="condition", type="string", example="GOOD"),
     *             @OA\Property(property="notes", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Asset returned")
     * )
     */
    public function returnAsset(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'condition' => 'nullable|in:NEW,GOOD,DAMAGED,LOST',
                'notes' => 'nullable|string',
            ]);

            $assignment = $this->assetService->returnAsset(
                $id,
                $validated['condition'] ?? 'GOOD',
                $validated['notes'] ?? null,
                Auth::id()
            );

            return response()->json($assignment->load(['asset', 'employee']));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * @OA\Get(
     *     path="/assets/unreturned",
     *     summary="Get list of unreturned assets",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="List of unreturned assets")
     * )
     */
    public function unreturned()
    {
        $assets = Asset::with(['currentAssignment.employee'])
            ->assigned()
            ->get();

        return response()->json($assets);
    }

    /**
     * @OA\Get(
     *     path="/assets/stats",
     *     summary="Get asset statistics",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Asset statistics")
     * )
     */
    public function stats()
    {
        $total = Asset::count();
        $available = Asset::available()->count();
        $assigned = Asset::assigned()->count();
        $maintenance = Asset::where('condition', 'DAMAGED')->count();

        return response()->json([
            'total' => $total,
            'available' => $available,
            'assigned' => $assigned,
            'maintenance' => $maintenance,
        ]);
    }
}
