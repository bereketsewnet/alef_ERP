<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AssetService;
use App\Models\Asset;
use App\Models\AssetAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use OpenApi\Annotations as OA;

class AssetController extends Controller
{
    private AssetService $assetService;

    public function __construct(AssetService $assetService)
    {
        $this->assetService = $assetService;
    }

    private function assetGroupId(?int $clientId, string $name, string $category): string
    {
        $identity = ($clientId ?? 'no-company')
            . '|' . mb_strtolower(trim($name))
            . '|' . mb_strtoupper(trim($category));
        $hash = md5($identity);

        return substr($hash, 0, 8) . '-'
            . substr($hash, 8, 4) . '-'
            . substr($hash, 12, 4) . '-'
            . substr($hash, 16, 4) . '-'
            . substr($hash, 20, 12);
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
        $query = Asset::with(['client', 'site', 'currentAssignment.employee']);

        if (!$request->boolean('include_batched')) {
            $query->whereNull('batch_id');
        }

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

    /** List bulk-created asset batches as one row per batch. */
    public function batches(Request $request)
    {
        $query = Asset::with(['client', 'site', 'currentAssignment'])
            ->whereNotNull('batch_id')
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $query->search($request->string('search')->toString());
        }

        $groups = $query->get()->groupBy('batch_id')->map(function ($assets) {
            $first = $assets->first();
            return [
                'batch_id' => $first->batch_id,
                'batch_name' => $first->batch_name,
                'asset_name' => $first->name,
                'category' => $first->category,
                'condition' => $first->condition,
                'quantity' => $assets->count(),
                'available_quantity' => $assets->filter(fn ($asset) => $asset->current_assignment_status === 'available')->count(),
                'assigned_quantity' => $assets->filter(fn ($asset) => (bool) $asset->currentAssignment)->count(),
                'client' => $first->client,
                'site' => $first->site,
                'created_at' => $first->created_at,
            ];
        })->values();

        return response()->json(['data' => $groups, 'total' => $groups->count()]);
    }

    /** Get every individually manageable asset in one batch. */
    public function showBatch(string $batchId)
    {
        $assets = Asset::with(['client', 'site', 'currentAssignment.employee'])
            ->where('batch_id', $batchId)
            ->orderBy('asset_code')
            ->get();

        abort_if($assets->isEmpty(), 404, 'Asset batch not found');

        return response()->json([
            'batch_id' => $batchId,
            'batch_name' => $assets->first()->batch_name,
            'quantity' => $assets->count(),
            'assets' => $assets,
        ]);
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
        $asset = Asset::with(['client', 'site', 'currentAssignment.employee', 'assignments.employee', 'assignments.assignedBy', 'assignments.returnedBy'])
            ->findOrFail($id);

        return response()->json($asset);
    }

    /**
     * List assignment and return history across all assets.
     */
    public function assignmentHistory(Request $request)
    {
        $query = AssetAssignment::with(['asset', 'employee', 'assignedBy', 'returnedBy'])
            ->latest('assigned_at');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($builder) use ($search) {
                $builder->whereHas('asset', function ($assetQuery) use ($search) {
                    $assetQuery->where('asset_code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                })->orWhereHas('employee', function ($employeeQuery) use ($search) {
                    $employeeQuery->where('employee_code', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            });
        }

        return response()->json($query->paginate($request->integer('per_page', 100)));
    }

    /**
     * Permanently delete one assignment history record and its evidence files.
     */
    public function destroyAssignment($assetId, $assignmentId)
    {
        $assignment = AssetAssignment::where('asset_id', $assetId)->findOrFail($assignmentId);

        foreach ([
            $assignment->assignment_document_path,
            $assignment->assignment_condition_image_path,
            $assignment->return_document_path,
            $assignment->return_condition_image_path,
        ] as $path) {
            if ($path) {
                Storage::disk('public')->delete($path);
            }
        }

        $wasActive = $assignment->returned_at === null;
        $assignment->delete();

        return response()->json([
            'message' => 'Assignment history deleted successfully',
            'asset_is_now_available' => $wasActive,
        ]);
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
            'asset_code' => 'required|string|max:255',
            'name' => 'required|string',
            'category' => 'required|string',
            'description' => 'nullable|string',
            'purchase_date' => 'nullable|date',
            'value' => 'nullable|numeric',
            'condition' => 'nullable|in:NEW,GOOD,DAMAGED,LOST',
            'client_id' => 'nullable|exists:clients,id|required_with:site_id',
            'site_id' => [
                'nullable',
                Rule::exists('client_sites', 'id')->where(
                    fn ($query) => $query->where('client_id', $request->input('client_id'))
                ),
            ],
            'quantity' => 'nullable|integer|min:1|max:500',
        ]);

        $quantity = (int) ($validated['quantity'] ?? 1);
        unset($validated['quantity']);
        $validated['condition'] = $validated['condition'] ?? 'NEW';

        $baseCode = $validated['asset_code'];
        $batchId = $this->assetGroupId(
            $validated['client_id'] ?? null,
            $validated['name'],
            $validated['category']
        );
        $codes = $quantity === 1
            ? [$baseCode]
            : array_map(
                fn ($number) => $baseCode . '-' . str_pad((string) $number, 3, '0', STR_PAD_LEFT),
                range(1, $quantity)
            );

        $existingCodes = Asset::withTrashed()->whereIn('asset_code', $codes)->pluck('asset_code');
        if ($existingCodes->isNotEmpty()) {
            throw ValidationException::withMessages([
                'asset_code' => 'These asset codes already exist: ' . $existingCodes->join(', '),
            ]);
        }

        $assets = DB::transaction(function () use ($validated, $codes, $batchId) {
            return collect($codes)->map(function ($code) use ($validated, $batchId) {
                return Asset::create([
                    ...$validated,
                    'asset_code' => $code,
                    'batch_id' => $batchId,
                    'batch_name' => $validated['name'],
                ]);
            });
        });

        if ($quantity === 1) {
            return response()->json($assets->first()->load(['client', 'site']), 201);
        }

        $assets->each(fn ($asset) => $asset->load(['client', 'site']));

        return response()->json([
            'message' => "{$quantity} assets created successfully",
            'count' => $quantity,
            'data' => $assets->values(),
        ], 201);
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
            'client_id' => 'nullable|exists:clients,id|required_with:site_id',
            'site_id' => [
                'nullable',
                Rule::exists('client_sites', 'id')->where(
                    fn ($query) => $query->where('client_id', $request->input('client_id'))
                ),
            ],
        ]);

        $asset->update($validated);
        $asset->update([
            'batch_id' => $this->assetGroupId($asset->client_id, $asset->name, $asset->category),
            'batch_name' => $asset->name,
        ]);

        return response()->json($asset->load(['client', 'site']));
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
                'assignment_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png,webp,doc,docx,txt|max:10240',
                'assignment_condition_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
            ]);

            $storedPaths = [];
            if ($request->hasFile('assignment_document')) {
                $storedPaths['assignment_document'] = $request->file('assignment_document')
                    ->store("asset-assignments/{$id}/handover", 'public');
            }
            if ($request->hasFile('assignment_condition_image')) {
                $storedPaths['assignment_condition_image'] = $request->file('assignment_condition_image')
                    ->store("asset-assignments/{$id}/handover", 'public');
            }

            try {
                $assignment = $this->assetService->assignAsset(
                    $id,
                    $validated['employee_id'],
                    $validated['notes'] ?? null,
                    Auth::id(),
                    $storedPaths['assignment_document'] ?? null,
                    $storedPaths['assignment_condition_image'] ?? null
                );
            } catch (\Throwable $exception) {
                foreach ($storedPaths as $path) {
                    Storage::disk('public')->delete($path);
                }
                throw $exception;
            }

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
                'return_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png,webp,doc,docx,txt|max:10240',
                'return_condition_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
            ]);

            $storedPaths = [];
            if ($request->hasFile('return_document')) {
                $storedPaths['return_document'] = $request->file('return_document')
                    ->store("asset-assignments/{$id}/return", 'public');
            }
            if ($request->hasFile('return_condition_image')) {
                $storedPaths['return_condition_image'] = $request->file('return_condition_image')
                    ->store("asset-assignments/{$id}/return", 'public');
            }

            try {
                $assignment = $this->assetService->returnAsset(
                    $id,
                    $validated['condition'] ?? 'GOOD',
                    $validated['notes'] ?? null,
                    Auth::id(),
                    $storedPaths['return_document'] ?? null,
                    $storedPaths['return_condition_image'] ?? null
                );
            } catch (\Throwable $exception) {
                foreach ($storedPaths as $path) {
                    Storage::disk('public')->delete($path);
                }
                throw $exception;
            }

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
