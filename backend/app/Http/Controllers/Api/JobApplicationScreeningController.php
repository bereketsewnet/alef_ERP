<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobApplicationScreening;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobApplicationScreeningController extends Controller
{
    /**
     * List all screenings for a given job application.
     */
    public function index(int $jobApplicationId): JsonResponse
    {
        $application = JobApplication::findOrFail($jobApplicationId);

        $screenings = JobApplicationScreening::where('job_application_id', $application->id)
            ->orderByDesc('screening_date')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($screenings);
    }

    /**
     * Create a new screening record for a job application.
     */
    public function store(Request $request, int $jobApplicationId): JsonResponse
    {
        $application = JobApplication::findOrFail($jobApplicationId);

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

        $validated['job_application_id'] = $application->id;

        $screening = JobApplicationScreening::create($validated);

        return response()->json($screening, 201);
    }

    /**
     * Update an existing screening record.
     */
    public function update(Request $request, int $jobApplicationId, int $screeningId): JsonResponse
    {
        $application = JobApplication::findOrFail($jobApplicationId);
        $screening = JobApplicationScreening::where('job_application_id', $application->id)->findOrFail($screeningId);

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
    public function destroy(int $jobApplicationId, int $screeningId): JsonResponse
    {
        $application = JobApplication::findOrFail($jobApplicationId);
        $screening = JobApplicationScreening::where('job_application_id', $application->id)->findOrFail($screeningId);
        $screening->delete();

        return response()->json(['message' => 'Screening record deleted successfully']);
    }
}

