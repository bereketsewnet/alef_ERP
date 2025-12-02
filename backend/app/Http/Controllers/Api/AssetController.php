<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AssetService;
use App\Models\Asset;
use App\Models\AssetAssignment;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    private AssetService $assetService;

    public function __construct(AssetService $assetService)
    {
        $this->assetService = $assetService;
    }

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

    public function assign(Request $request)
    {
        $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'employee_id' => 'required|exists:employees,id',
            'notes' => 'nullable|string',
        ]);

        $result = $this->assetService->assignAsset(
            $request->asset_id,
            $request->employee_id,
            $request->notes
        );

        if (!$result['success']) {
            return response()->json(['error' => $result['message']], 400);
        }

        return response()->json($result['assignment'], 201);
    }

    public function returnAsset(Request $request)
    {
        $request->validate([
            'assignment_id' => 'required|exists:asset_assignments,id',
            'return_condition' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $result = $this->assetService->returnAsset(
            $request->assignment_id,
            $request->return_condition,
            $request->notes
        );

        if (!$result['success']) {
            return response()->json(['error' => $result['message']], 400);
        }

        return response()->json(['message' => $result['message']]);
    }

    public function employeeAssets($employeeId)
    {
        $assignments = AssetAssignment::with('asset')
            ->where('assigned_to_employee_id', $employeeId)
            ->whereNull('returned_at')
            ->get();

        return response()->json($assignments);
    }
}
