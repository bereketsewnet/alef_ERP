<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class JobApplicationController extends Controller
{
    /**
     * List all job applications with their jobs.
     */
    public function index(): JsonResponse
    {
        $applications = JobApplication::with(['jobs', 'vacancy'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($applications);
    }

    /**
     * Store a new job application.
     *
     * Expected payload:
     * - applicant_id: string
     * - age: integer
     * - education: string
     * - experience: string
     * - job_ids: integer[] (IDs of jobs being applied for)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vacancy_id' => 'nullable|integer|exists:vacancies,id',
            'applicant_id' => 'required|string|max:255',
            'age' => 'required|integer|min:15|max:100',
            'sex' => 'required|in:MALE,FEMALE',
            'phone_number' => ['required', 'string', 'max:50', 'regex:/^\+?[0-9][0-9\s\-()]{7,24}$/'],
            'email' => 'nullable|email|max:255',
            'education' => 'required|string|max:500',
            'experience' => 'required|string',
            'job_ids' => 'required|array|min:1',
            'job_ids.*' => 'integer|exists:jobs,id',
        ]);

        $application = JobApplication::create([
            'vacancy_id' => $validated['vacancy_id'] ?? null,
            'applicant_id' => $validated['applicant_id'],
            'age' => $validated['age'],
            'sex' => $validated['sex'],
            'phone_number' => $validated['phone_number'],
            'email' => $validated['email'] ?? null,
            'education' => $validated['education'],
            'experience' => $validated['experience'],
        ]);

        $application->jobs()->sync($validated['job_ids']);
        $application->load('jobs');

        return response()->json($application, 201);
    }

    /**
     * Show a single job application.
     */
    public function show(int $id): JsonResponse
    {
        $application = JobApplication::with(['jobs', 'vacancy'])->findOrFail($id);

        return response()->json($application);
    }

    /**
     * Update an existing job application.
     *
     * job_ids is optional; when provided, it will replace the current jobs.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $application = JobApplication::findOrFail($id);

        $validated = $request->validate([
            'vacancy_id' => 'sometimes|integer|exists:vacancies,id',
            'applicant_id' => 'sometimes|string|max:255',
            'age' => 'sometimes|integer|min:15|max:100',
            'sex' => 'sometimes|required|in:MALE,FEMALE',
            'phone_number' => ['sometimes', 'required', 'string', 'max:50', 'regex:/^\+?[0-9][0-9\s\-()]{7,24}$/'],
            'email' => 'nullable|email|max:255',
            'education' => 'sometimes|string|max:500',
            'experience' => 'sometimes|string',
            'job_ids' => 'sometimes|array|min:1',
            'job_ids.*' => 'integer|exists:jobs,id',
        ]);

        $application->update(collect($validated)->except('job_ids')->toArray());

        if (array_key_exists('job_ids', $validated)) {
            $application->jobs()->sync($validated['job_ids']);
        }

        $application->load(['jobs', 'vacancy']);

        return response()->json($application);
    }

    /**
     * Delete a job application.
     */
    public function destroy(int $id): JsonResponse
    {
        $application = JobApplication::findOrFail($id);
        if ($application->cv_path) Storage::disk('local')->delete($application->cv_path);
        $application->delete();

        return response()->json(['message' => 'Job application deleted successfully']);
    }

    public function downloadCv(int $id)
    {
        $application = JobApplication::findOrFail($id);
        abort_unless($application->cv_path && Storage::disk('local')->exists($application->cv_path), 404, 'CV file not found.');
        return Storage::disk('local')->download($application->cv_path, $application->cv_original_name ?: 'applicant-cv');
    }
}

