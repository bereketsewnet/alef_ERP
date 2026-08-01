<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\Vacancy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            'phone_number' => ['required', 'string', 'max:50', 'regex:/^\+?[0-9][0-9\s\-()]{7,24}$/'],
            'email' => 'nullable|email|max:255',
            'education' => 'required|string|max:500',
            'experience' => 'required|string|max:5000',
            'cv' => 'required|file|mimes:pdf,doc,docx|max:10240',
            'privacy_consent' => 'required|accepted',
            'website' => 'nullable|max:0',
        ], [
            'vacancy_id.exists' => 'The selected vacancy is unavailable or no longer active.',
            'privacy_consent.accepted' => 'You must accept the privacy notice before applying.',
        ]);

        $cv = $request->file('cv');
        $extension = strtolower($cv->getClientOriginalExtension());
        $path = $cv->storeAs('job-application-cvs/' . now()->format('Y/m'), Str::uuid() . '.' . $extension, 'local');
        if (!$path) return response()->json(['message' => 'The CV could not be stored. Please try again.'], 500);

        try {
            $application = JobApplication::create([
                'vacancy_id' => $validated['vacancy_id'],
                'applicant_id' => trim($validated['applicant_id']),
                'age' => $validated['age'],
                'sex' => $validated['sex'],
                'phone_number' => trim($validated['phone_number']),
                'email' => isset($validated['email']) ? strtolower(trim($validated['email'])) : null,
                'education' => trim($validated['education']),
                'experience' => trim($validated['experience']),
                'cv_path' => $path,
                'cv_original_name' => $cv->getClientOriginalName(),
                'cv_mime_type' => $cv->getMimeType(),
                'cv_size_bytes' => $cv->getSize(),
            ]);
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($path);
            throw $error;
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
