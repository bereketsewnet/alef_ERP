<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\JobApplication;
use App\Models\Vacancy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PublicRecruitmentController extends Controller
{
    public function vacancies(): JsonResponse
    {
        return response()->json([
            'data' => Vacancy::where('is_active', true)->latest()->get([
                'id', 'title_en', 'title_am', 'description', 'qualification',
                'more_info', 'number_of_employees', 'created_at',
            ]),
        ]);
    }

    public function vacancy(int $id): JsonResponse
    {
        $vacancy = Vacancy::where('is_active', true)->findOrFail($id, [
            'id', 'title_en', 'title_am', 'description', 'qualification',
            'more_info', 'number_of_employees', 'created_at',
        ]);

        return response()->json(['data' => $vacancy]);
    }

    public function jobs(): JsonResponse
    {
        return response()->json([
            'data' => Job::with('category:id,name')
                ->where('is_active', true)
                ->orderBy('job_name')
                ->get(['id', 'category_id', 'job_code', 'job_name', 'description']),
        ]);
    }

    public function apply(Request $request): JsonResponse
    {
        // Honeypot: bots commonly populate hidden fields that real users never see.
        if ($request->filled('website')) {
            return response()->json(['message' => 'Application rejected.'], 422);
        }

        $validated = $request->validate([
            'vacancy_id' => [
                'required', 'integer',
                Rule::exists('vacancies', 'id')->where(fn ($query) => $query->where('is_active', true)),
            ],
            'applicant_id' => 'required|string|min:2|max:255',
            'age' => 'required|integer|min:15|max:100',
            'sex' => 'required|in:MALE,FEMALE',
            'education' => 'required|string|max:500',
            'experience' => 'required|string|max:5000',
            'job_ids' => 'sometimes|array|max:10',
            'job_ids.*' => [
                'integer', 'distinct',
                Rule::exists('jobs', 'id')->where(fn ($query) => $query->where('is_active', true)->whereNull('deleted_at')),
            ],
            'privacy_consent' => 'required|accepted',
            'website' => 'nullable|max:0',
        ], [
            'vacancy_id.exists' => 'The selected vacancy is unavailable or no longer active.',
            'privacy_consent.accepted' => 'You must accept the privacy notice before applying.',
        ]);

        $application = JobApplication::create([
            'vacancy_id' => $validated['vacancy_id'],
            'applicant_id' => trim($validated['applicant_id']),
            'age' => $validated['age'],
            'sex' => $validated['sex'],
            'education' => trim($validated['education']),
            'experience' => trim($validated['experience']),
        ]);
        if (!empty($validated['job_ids'])) {
            $application->jobs()->sync($validated['job_ids']);
        }

        return response()->json([
            'message' => 'Your application was submitted successfully.',
            'data' => [
                'reference' => 'APP-' . str_pad((string) $application->id, 6, '0', STR_PAD_LEFT),
                'vacancy_id' => $application->vacancy_id,
                'submitted_at' => $application->created_at->toIso8601String(),
            ],
        ], 201);
    }
}
