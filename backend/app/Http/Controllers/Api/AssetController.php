<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AssetService;
use App\Models\Asset;
use App\Models\AssetAssignment;
use Illuminate\Http\Request;
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
     *     summary="List all assets",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="category", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="condition", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="List of assets")
     * )
     */
    public function index(Request $request)
    {
        $query = Asset::query();

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('condition')) {
            $query->where('condition', $request->condition);
        }

        return response()->json($query->paginate(50));
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
     *             @OA\Property(property="purchase_date", type="string", format="date"),
     *             @OA\Property(property="value", type="number", format="float")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Asset created")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'asset_code' => 'required|string|unique:assets',
            'name' => 'required|string',
            'category' => 'required|string',
            'purchase_date' => 'nullable|date',
            'value' => 'nullable|numeric',
        ]);

        $asset = Asset::create($request->all());

        return response()->json($asset, 201);
    }

    /**
     * @OA\Post(
     *     path="/assets/assign",
     *     summary="Assign asset to employee",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"asset_id", "employee_id"},
     *             @OA\Property(property="asset_id", type="integer"),
     *             @OA\Property(property="employee_id", type="integer"),
     *             @OA\Property(property="notes", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Asset assigned")
     * )
     */
    public function assign(Request $request)
    {
        try {
            $assignment = $this->assetService->assignAsset(
                $request->asset_id,
                $request->employee_id,
                $request->notes
            );
            return response()->json($assignment);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * @OA\Post(
     *     path="/assets/return",
     *     summary="Return an asset",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"asset_id"},
     *             @OA\Property(property="asset_id", type="integer"),
     *             @OA\Property(property="condition", type="string", example="GOOD"),
     *             @OA\Property(property="notes", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Asset returned")
     * )
     */
    public function returnAsset(Request $request)
    {
        try {
            $assignment = $this->assetService->returnAsset(
                $request->asset_id,
                $request->condition,
                $request->notes
            );
            return response()->json($assignment);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * @OA\Get(
     *     path="/assets/employee/{employeeId}",
     *     summary="Get assets assigned to employee",
     *     tags={"Assets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="employeeId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="List of assigned assets")
     * )
     */
    public function employeeAssets($employeeId)
    {
        $assets = Asset::whereHas('currentAssignment', function ($q) use ($employeeId) {
            $q->where('employee_id', $employeeId);
        })->get();

        return response()->json($assets);
    }
}
