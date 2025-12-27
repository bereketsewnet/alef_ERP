<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\JobCategory;
use App\Models\JobSkill;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class JobController extends Controller
{
    /**
     * Get all jobs with filtering
     */
    public function index(Request $request): JsonResponse
    {
        $query = Job::with(['category', 'skills']);
        
        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        
        // Filter by active status
        if ($request->has('active_only') && $request->active_only) {
            $query->where('is_active', true);
        }
        
        // Filter by pay type
        if ($request->has('pay_type')) {
            $query->where('pay_type', $request->pay_type);
        }
        
        // Search by name or code
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('job_name', 'ILIKE', "%{$search}%")
                  ->orWhere('job_code', 'ILIKE', "%{$search}%");
            });
        }
        
        $jobs = $query->orderBy('job_name')->get();
        
        return response()->json($jobs);
    }

    /**
     * Create a new job
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:job_categories,id',
            'job_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'pay_type' => 'required|in:HOURLY,MONTHLY',
            'base_salary' => 'nullable|numeric|min:0|required_if:pay_type,MONTHLY',
            'hourly_rate' => 'nullable|numeric|min:0|required_if:pay_type,HOURLY',
            'overtime_multiplier' => 'nullable|numeric|min:1|max:5',
            'tax_percent' => 'nullable|numeric|min:0|max:100',
            'late_penalty' => 'nullable|numeric|min:0',
            'absent_penalty' => 'nullable|numeric|min:0',
            'agency_fee_percent' => 'nullable|numeric|min:0|max:100',
            'is_active' => 'nullable|boolean',
        ]);
        
        // Set defaults for pay_type specific fields
        if ($validated['pay_type'] === 'MONTHLY') {
            $validated['hourly_rate'] = $validated['hourly_rate'] ?? 0;
            $validated['base_salary'] = $validated['base_salary'] ?? 0;
        } else {
            $validated['base_salary'] = $validated['base_salary'] ?? 0;
            $validated['hourly_rate'] = $validated['hourly_rate'] ?? 0;
        }
        
        $job = Job::create($validated);
        $job->load(['category', 'skills']);
        
        return response()->json($job, 201);
    }

    /**
     * Get a specific job
     */
    public function show(int $id): JsonResponse
    {
        $job = Job::with(['category', 'skills', 'employees', 'sites'])->findOrFail($id);
        
        return response()->json($job);
    }

    /**
     * Update a job
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $job = Job::findOrFail($id);
        
        $validated = $request->validate([
            'category_id' => 'sometimes|exists:job_categories,id',
            'job_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'pay_type' => 'sometimes|in:HOURLY,MONTHLY',
            'base_salary' => 'sometimes|numeric|min:0',
            'hourly_rate' => 'sometimes|numeric|min:0',
            'overtime_multiplier' => 'numeric|min:1|max:5',
            'tax_percent' => 'numeric|min:0|max:100',
            'late_penalty' => 'numeric|min:0',
            'absent_penalty' => 'numeric|min:0',
            'agency_fee_percent' => 'numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);
        
        $job->update($validated);
        $job->load(['category', 'skills']);
        
        return response()->json($job);
    }

    /**
     * Delete (soft delete) a job
     */
    public function destroy(int $id): JsonResponse
    {
        $job = Job::findOrFail($id);
        $job->delete();
        
        return response()->json(['message' => 'Job deleted successfully']);
    }

    /**
     * Add a skill to a job
     */
    public function addSkill(Request $request, int $jobId): JsonResponse
    {
        $job = Job::findOrFail($jobId);
        
        $validated = $request->validate([
            'skill_name' => 'required|string|max:255',
            'is_required' => 'boolean',
        ]);
        
        $skill = $job->skills()->create($validated);
        
        return response()->json($skill, 201);
    }

    /**
     * Remove a skill from a job
     */
    public function removeSkill(int $jobId, int $skillId): JsonResponse
    {
        $job = Job::findOrFail($jobId);
        $skill = $job->skills()->findOrFail($skillId);
        $skill->delete();
        
        return response()->json(['message' => 'Skill removed successfully']);
    }

    /**
     * Get employees for a specific job
     */
    public function getEmployees(int $id): JsonResponse
    {
        $job = Job::findOrFail($id);
        $employees = $job->employees()->with('jobRole')->get();
        
        return response()->json($employees);
    }

    /**
     * Get sites that require this job
     */
    public function getSites(int $id): JsonResponse
    {
        $job = Job::findOrFail($id);
        $sites = $job->sites()->with('client')->get();
        
        return response()->json($sites);
    }
}
