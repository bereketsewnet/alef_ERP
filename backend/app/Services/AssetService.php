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
     * @return array ['success' => bool, 'message' => string, 'assignment' => AssetAssignment|null]
     */
    public function assignAsset(int $assetId, int $employeeId, ?string $notes = null): array
    {
        $asset = Asset::find($assetId);

        if (!$asset) {
            return ['success' => false, 'message' => 'Asset not found', 'assignment' => null];
        }

        // Check if asset is already assigned
        $existingAssignment = AssetAssignment::where('asset_id', $assetId)
            ->whereNull('returned_at')
            ->first();

        if ($existingAssignment) {
            return ['success' => false, 'message' => 'Asset is already assigned', 'assignment' => null];
        }

        // Create assignment
        $assignment = AssetAssignment::create([
            'asset_id' => $assetId,
            'assigned_to_employee_id' => $employeeId,
            'assigned_at' => now(),
            'notes' => $notes,
        ]);

        // Update asset condition if needed
        if ($asset->condition === 'NEW') {
            $asset->update(['condition' => 'GOOD']);
        }

        return [
            'success' => true,
            'message' => 'Asset assigned successfully',
            'assignment' => $assignment,
        ];
    }

    /**
     * Return asset from employee
     *
     * @param int $assignmentId
     * @param string $returnCondition
     * @param string|null $notes
     * @return array ['success' => bool, 'message' => string]
     */
    public function returnAsset(int $assignmentId, string $returnCondition, ?string $notes = null): array
    {
        $assignment = AssetAssignment::find($assignmentId);

        if (!$assignment) {
            return ['success' => false, 'message' => 'Assignment not found'];
        }

        if ($assignment->returned_at) {
            return ['success' => false, 'message' => 'Asset already returned'];
        }

        // Update assignment
        $assignment->update([
            'returned_at' => now(),
            'return_condition' => $returnCondition,
            'notes' => $assignment->notes . "\n" . $notes,
        ]);

        // Update asset condition
        $assignment->asset->update(['condition' => $returnCondition]);

        return [
            'success' => true,
            'message' => 'Asset returned successfully',
        ];
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
