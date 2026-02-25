<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeScreening;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeScreeningController extends Controller
{
    /**
     * List all screenings for a given employee.
     */
    public function index(int $employeeId): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);

        $screenings = EmployeeScreening::where('employee_id', $employee->id)
            ->orderByDesc('screening_date')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($screenings);
    }

    /**
     * Create a new screening record for an employee.
     */
    public function store(Request $request, int $employeeId): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);

        $validated = $request->validate([
            'category' => 'required|string|max:100',
            'screening_date' => 'nullable|date',
            'interview_passed' => 'nullable|boolean',
            'written_exam_required' => 'boolean',
            'written_score' => 'nullable|integer|min:0|max:100',
            'written_passed' => 'nullable|boolean',
            'practical_exam_required' => 'boolean',
            'practical_score' => 'nullable|integer|min:0|max:100',
            'practical_passed' => 'nullable|boolean',
            'overall_passed' => 'nullable|boolean',
            'vehicle_rental_cost' => 'nullable|numeric|min:0',
            'vehicle_rental_paid_by_candidate' => 'nullable|numeric|min:0',
            'vehicle_rental_paid_by_company' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $validated['employee_id'] = $employee->id;

        $screening = EmployeeScreening::create($validated);

        return response()->json($screening, 201);
    }

    /**
     * Update an existing screening record.
     */
    public function update(Request $request, int $employeeId, int $screeningId): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);
        $screening = EmployeeScreening::where('employee_id', $employee->id)->findOrFail($screeningId);

        $validated = $request->validate([
            'category' => 'sometimes|string|max:100',
            'screening_date' => 'nullable|date',
            'interview_passed' => 'nullable|boolean',
            'written_exam_required' => 'boolean',
            'written_score' => 'nullable|integer|min:0|max:100',
            'written_passed' => 'nullable|boolean',
            'practical_exam_required' => 'boolean',
            'practical_score' => 'nullable|integer|min:0|max:100',
            'practical_passed' => 'nullable|boolean',
            'overall_passed' => 'nullable|boolean',
            'vehicle_rental_cost' => 'nullable|numeric|min:0',
            'vehicle_rental_paid_by_candidate' => 'nullable|numeric|min:0',
            'vehicle_rental_paid_by_company' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $screening->update($validated);

        return response()->json($screening);
    }

    /**
     * Delete a screening record.
     */
    public function destroy(int $employeeId, int $screeningId): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);
        $screening = EmployeeScreening::where('employee_id', $employee->id)->findOrFail($screeningId);
        $screening->delete();

        return response()->json(['message' => 'Screening record deleted successfully']);
    }
}

