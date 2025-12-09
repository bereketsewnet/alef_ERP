<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class JobCategoryController extends Controller
{
    /**
     * Get all job categories
     */
    public function index(Request $request): JsonResponse
    {
        $query = JobCategory::withCount('jobs');
        
        if ($request->has('active_only') && $request->active_only) {
            $query->where('is_active', true);
        }
        
        $categories = $query->orderBy('name')->get();
        
        return response()->json($categories);
    }

    /**
     * Create a new job category
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:job_categories,code|alpha_num|uppercase',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        
        $category = JobCategory::create($validated);
        
        return response()->json($category, 201);
    }

    /**
     * Get a specific job category
     */
    public function show(int $id): JsonResponse
    {
        $category = JobCategory::with('jobs')->findOrFail($id);
        
        return response()->json($category);
    }

    /**
     * Update a job category
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = JobCategory::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:10|alpha_num|uppercase|unique:job_categories,code,' . $id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        
        $category->update($validated);
        
        return response()->json($category);
    }

    /**
     * Delete a job category
     */
    public function destroy(int $id): JsonResponse
    {
        $category = JobCategory::findOrFail($id);
        
        // Check if category has jobs
        if ($category->jobs()->count() > 0) {
            return response()->json([
                'error' => 'Cannot delete category with existing jobs. Remove or reassign jobs first.'
            ], 422);
        }
        
        $category->delete();
        
        return response()->json(['message' => 'Category deleted successfully']);
    }
}
