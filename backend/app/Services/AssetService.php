<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\Employee;
use Carbon\Carbon;

/**
 * Asset Service
 * 
 * Manages asset assignment, returns, and tracking
 */
class AssetService
{
    /**
     * Assign asset to employee
     *
     * @param int $assetId
     * @param int $employeeId
     * @param string|null $notes
     * @param int|null $assignedByUserId
     * @return AssetAssignment
     * @throws \Exception
     */
    public function assignAsset(int $assetId, int $employeeId, ?string $notes = null, ?int $assignedByUserId = null): AssetAssignment
    {
        $asset = Asset::findOrFail($assetId);

        // Check if asset is already assigned
        $existingAssignment = AssetAssignment::where('asset_id', $assetId)
            ->whereNull('returned_at')
            ->first();

        if ($existingAssignment) {
            throw new \Exception('Asset is already assigned');
        }

        // Check if asset is available for assignment
        if ($asset->condition === 'LOST') {
            throw new \Exception('Cannot assign lost asset');
        }

        // Create assignment
        $assignment = AssetAssignment::create([
            'asset_id' => $assetId,
            'assigned_to_employee_id' => $employeeId,
            'assigned_at' => now(),
            'notes' => $notes,
            'assigned_by_user_id' => $assignedByUserId,
        ]);

        // Update asset condition if it's new
        if ($asset->condition === 'NEW') {
            $asset->update(['condition' => 'GOOD']);
        }

        return $assignment;
    }

    /**
     * Return asset from employee
     *
     * @param int $assetId
     * @param string $returnCondition
     * @param string|null $notes
     * @param int|null $returnedByUserId
     * @return AssetAssignment
     * @throws \Exception
     */
    public function returnAsset(int $assetId, string $returnCondition, ?string $notes = null, ?int $returnedByUserId = null): AssetAssignment
    {
        $asset = Asset::findOrFail($assetId);

        // Find active assignment
        $assignment = AssetAssignment::where('asset_id', $assetId)
            ->whereNull('returned_at')
            ->first();

        if (!$assignment) {
            throw new \Exception('No active assignment found for this asset');
        }

        // Update assignment
        $assignment->update([
            'returned_at' => now(),
            'return_condition' => $returnCondition,
            'notes' => $assignment->notes ? $assignment->notes . "\n" . $notes : $notes,
            'returned_by_user_id' => $returnedByUserId,
        ]);

        // Update asset condition
        $asset->update(['condition' => $returnCondition]);

        return $assignment;
    }

    /**
     * Check unreturned assets for an employee (used during termination)
     *
     * @param int $employeeId
     * @return array
     */
    public function getUnreturnedAssets(int $employeeId): array
    {
        $assignments = AssetAssignment::with('asset')
            ->where('assigned_to_employee_id', $employeeId)
            ->whereNull('returned_at')
            ->get();

        $totalValue = $assignments->sum(function ($assignment) {
            return $assignment->asset->value;
        });

        return [
            'count' => $assignments->count(),
            'assignments' => $assignments,
            'total_value' => $totalValue,
        ];
    }

    /**
     * Auto-apply deductions for unreturned assets
     *
     * @param int $employeeId
     * @return float Total deduction amount
     */
    public function calculateAssetDeductions(int $employeeId): float
    {
        $unreturned = $this->getUnreturnedAssets($employeeId);
        return $unreturned['total_value'];
    }
}
