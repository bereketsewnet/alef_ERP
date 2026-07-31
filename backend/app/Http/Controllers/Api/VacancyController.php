<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vacancy;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class VacancyController extends Controller
{
    /**
     * Get all vacancies
     */
    public function index(Request $request): JsonResponse
    {
        $query = Vacancy::query();

        if ($request->has('active_only') && $request->active_only) {
            $query->where('is_active', true);
        }

        $vacancies = $query->orderBy('created_at', 'desc')->get();

        return response()->json($vacancies);
    }

    /**
     * Create a new vacancy
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title_en' => 'required|string|max:255',
            'title_am' => 'required|string|max:500',
            'description' => 'nullable|string',
            'qualification' => 'nullable|string',
            'more_info' => 'nullable|string|max:5000',
            'number_of_employees' => 'required|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $vacancy = Vacancy::create($validated);

        return response()->json($vacancy, 201);
    }

    /**
     * Get a specific vacancy
     */
    public function show(int $id): JsonResponse
    {
        $vacancy = Vacancy::findOrFail($id);

        return response()->json($vacancy);
    }

    /**
     * Update a vacancy
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $vacancy = Vacancy::findOrFail($id);

        $validated = $request->validate([
            'title_en' => 'sometimes|string|max:255',
            'title_am' => 'sometimes|string|max:500',
            'description' => 'nullable|string',
            'qualification' => 'nullable|string',
            'more_info' => 'nullable|string|max:5000',
            'number_of_employees' => 'sometimes|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $vacancy->update($validated);

        return response()->json($vacancy);
    }

    /**
     * Delete a vacancy
     */
    public function destroy(int $id): JsonResponse
    {
        $vacancy = Vacancy::findOrFail($id);
        $vacancy->delete();

        return response()->json(['message' => 'Vacancy deleted successfully']);
    }
}
