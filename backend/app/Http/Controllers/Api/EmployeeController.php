<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class EmployeeController extends Controller
{
    /**
     * @OA\Get(
     *     path="/employees",
     *     summary="List all employees",
     *     tags={"Employees"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="status", in="query", @OA\Schema(type="string", enum={"ACTIVE", "TERMINATED", "ON_LEAVE"})),
     *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="List of employees")
     * )
     */
    public function index(Request $request)
    {
        $query = Employee::with(['jobRole.department']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $searchTerm = strtolower($request->search);
            $query->where(function($q) use ($searchTerm) {
                $q->whereRaw('LOWER(first_name) like ?', ['%' . $searchTerm . '%'])
                  ->orWhereRaw('LOWER(last_name) like ?', ['%' . $searchTerm . '%'])
                  ->orWhereRaw('LOWER(email) like ?', ['%' . $searchTerm . '%'])
                  ->orWhereRaw('LOWER(phone_number) like ?', ['%' . $searchTerm . '%'])
                  ->orWhereRaw('LOWER(employee_code) like ?', ['%' . $searchTerm . '%']);
            });
        }

        return response()->json($query->paginate(50));
    }

    /**
     * @OA\Post(
     *     path="/employees",
     *     summary="Create a new employee",
     *     tags={"Employees"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"employee_code", "first_name", "last_name", "phone_number", "job_role_id", "hire_date"},
     *             @OA\Property(property="employee_code", type="string"),
     *             @OA\Property(property="first_name", type="string"),
     *             @OA\Property(property="last_name", type="string"),
     *             @OA\Property(property="phone_number", type="string"),
     *             @OA\Property(property="job_role_id", type="integer"),
     *             @OA\Property(property="hire_date", type="string", format="date"),
     *             @OA\Property(property="guarantor_details", type="object")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Employee created")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'nullable|sometimes|email|unique:employees,email',
            'phone_number' => 'required|string|unique:employees,phone_number',
            'status' => 'nullable|in:active,probation,inactive,terminated',
            'hire_date' => 'required|date',
        ]);

        // Generate unique employee code
        $lastEmployee = Employee::orderBy('id', 'desc')->first();
        $nextNumber = $lastEmployee ? ($lastEmployee->id + 1) : 1;
        $employeeCode = 'EMP' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

        try {
            DB::beginTransaction();

            $employee = Employee::create([
                'employee_code' => $employeeCode,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'phone_number' => $request->phone_number,
                'email' => $request->email ?? null,
                'status' => $request->status ?? 'active',
                'hire_date' => $request->hire_date,
                'job_role_id' => null,
            ]);

            // Create associated User account for login
            // Generate username from first and last name
            $username = strtolower($request->first_name . '.' . $request->last_name);
            
            // Ensure username is unique
            $originalUsername = $username;
            $counter = 1;
            while (User::where('username', $username)->exists()) {
                $username = $originalUsername . $counter;
                $counter++;
            }

            // Generate a secure default password
            // Format: EmployeeCode + Last 4 digits of phone (e.g., EMP00001-5678)
            $phoneDigits = preg_replace('/\D/', '', $request->phone_number);
            $last4Digits = substr($phoneDigits, -4);
            $defaultPassword = $employeeCode . '-' . $last4Digits;
            
            // If phone/email already exists in users, link it
            $existingUser = User::where('phone_number', $request->phone_number)->first();
            $userAccount = null;

            if ($existingUser) {
                $existingUser->update(['employee_id' => $employee->id]);
                $userAccount = $existingUser;
                // Use existing password (don't reset it)
                $defaultPassword = null;
            } else {
                $userAccount = User::create([
                    'username' => $username,
                    'email' => $request->email ?? ($username . '@alefdelta.com'), // Use company domain
                    'phone_number' => $request->phone_number,
                    'password' => Hash::make($defaultPassword),
                    'role' => 'FIELD_STAFF',
                    'is_active' => true,
                    'employee_id' => $employee->id,
                ]);
            }

            DB::commit();

            // Return employee data with login credentials
            $responseData = [
                'data' => $employee->load(['user', 'jobRole']),
            ];
            
            // Include login credentials if new user was created
            if ($defaultPassword) {
                $responseData['login_credentials'] = [
                    'username' => $username,
                    'email' => $userAccount->email,
                    'password' => $defaultPassword,
                    'message' => 'Please share these credentials with the employee. They should change their password on first login.',
                ];
            }

            return response()->json($responseData, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Failed to create employee',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/employees/{id}",
     *     summary="Get employee details",
     *     tags={"Employees"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Employee details")
     * )
     */
    public function show($id)
    {
        $employee = Employee::with(['jobRole.department', 'user', 'assetAssignments.asset'])->findOrFail($id);
        return response()->json($employee);
    }

    /**
     * @OA\Put(
     *     path="/employees/{id}",
     *     summary="Update employee details",
     *     tags={"Employees"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="employee_code", type="string"),
     *             @OA\Property(property="first_name", type="string"),
     *             @OA\Property(property="last_name", type="string"),
     *             @OA\Property(property="phone_number", type="string"),
     *             @OA\Property(property="job_role_id", type="integer"),
     *             @OA\Property(property="status", type="string", enum={"ACTIVE", "TERMINATED", "ON_LEAVE"})
     *         )
     *     ),
     *     @OA\Response(response=200, description="Employee updated")
     * )
     */
    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);

        $request->validate([
            'first_name' => 'sometimes|string',
            'last_name' => 'sometimes|string',
            'email' => 'nullable|sometimes|email',
            'phone_number' => 'sometimes|string',
            'status' => 'sometimes|in:active,probation,inactive,terminated',
            'hire_date' => 'sometimes|date',
        ]);

        $employee->update($request->only([
            'first_name',
            'last_name',
            'email',
            'phone_number',
            'status',
            'hire_date',
        ]));

        return response()->json(['data' => $employee]);
    }

    /**
     * @OA\Delete(
     *     path="/employees/{id}",
     *     summary="Delete an employee",
     *     tags={"Employees"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Employee deleted successfully"),
     *     @OA\Response(response=404, description="Employee not found")
     * )
     */
    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        
        try {
            DB::beginTransaction();
            
            // Delete associated user account if it exists
            $user = User::where('employee_id', $id)->first();
            if ($user) {
                // Determine if we should delete or just unlink?
                // User asked to "delete the user account also"
                $user->delete();
            }
            
            $employee->delete();
            
            DB::commit();
    
            return response()->json([
                'message' => 'Employee and associated user account deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Failed to delete employee',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/employees/link-telegram",
     *     summary="Link employee to Telegram account",
     *     tags={"Employees"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"employee_id", "telegram_chat_id"},
     *             @OA\Property(property="employee_id", type="integer"),
     *             @OA\Property(property="telegram_chat_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Telegram linked successfully"),
     *     @OA\Response(response=404, description="Telegram user not found")
     * )
     */
    public function linkTelegram(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'telegram_chat_id' => 'required|integer',
        ]);

        $user = User::where('telegram_chat_id', $request->telegram_chat_id)->first();

        if ($user) {
            $user->update(['employee_id' => $request->employee_id]);
            return response()->json(['message' => 'Telegram account linked successfully', 'user' => $user]);
        }

        return response()->json(['error' => 'Telegram user not found'], 404);
    }

    /**
     * Get all jobs assigned to an employee
     */
    public function getJobs($id)
    {
        $employee = Employee::findOrFail($id);
        $jobs = $employee->jobs()->with('category')->get();
        
        return response()->json($jobs);
    }

    /**
     * Assign a job to an employee
     */
    public function assignJob(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        
        $validated = $request->validate([
            'job_id' => 'required|exists:jobs,id',
            'is_primary' => 'boolean',
            'override_salary' => 'nullable|numeric|min:0',
            'override_hourly_rate' => 'nullable|numeric|min:0',
            'override_tax_percent' => 'nullable|numeric|min:0|max:100',
            'override_late_penalty' => 'nullable|numeric|min:0',
            'override_absent_penalty' => 'nullable|numeric|min:0',
            'override_agency_fee_percent' => 'nullable|numeric|min:0|max:100',
            'override_overtime_multiplier' => 'nullable|numeric|min:1|max:5',
        ]);
        
        // Check if already assigned
        if ($employee->hasJob($validated['job_id'])) {
            return response()->json(['error' => 'Job already assigned to this employee'], 422);
        }
        
        // If this is the first job or is_primary is true, ensure it's primary
        $isPrimary = $validated['is_primary'] ?? false;
        if ($employee->jobs()->count() === 0) {
            $isPrimary = true; // First job is always primary
        }
        
        // If setting as primary, unset other primaries
        if ($isPrimary) {
            $employee->jobs()->updateExistingPivot(
                $employee->jobs()->pluck('jobs.id')->toArray(),
                ['is_primary' => false]
            );
        }
        
        // Attach the job with overrides
        $employee->jobs()->attach($validated['job_id'], [
            'is_primary' => $isPrimary,
            'override_salary' => $validated['override_salary'] ?? null,
            'override_hourly_rate' => $validated['override_hourly_rate'] ?? null,
            'override_tax_percent' => $validated['override_tax_percent'] ?? null,
            'override_late_penalty' => $validated['override_late_penalty'] ?? null,
            'override_absent_penalty' => $validated['override_absent_penalty'] ?? null,
            'override_agency_fee_percent' => $validated['override_agency_fee_percent'] ?? null,
            'override_overtime_multiplier' => $validated['override_overtime_multiplier'] ?? null,
        ]);
        
        $employee->load('jobs.category');
        
        return response()->json([
            'message' => 'Job assigned successfully',
            'employee' => $employee
        ], 201);
    }

    /**
     * Update job overrides for an employee
     */
    public function updateJob(Request $request, $employeeId, $jobId)
    {
        $employee = Employee::findOrFail($employeeId);
        
        if (!$employee->hasJob($jobId)) {
            return response()->json(['error' => 'Job not assigned to this employee'], 404);
        }
        
        $validated = $request->validate([
            'override_salary' => 'nullable|numeric|min:0',
            'override_hourly_rate' => 'nullable|numeric|min:0',
            'override_tax_percent' => 'nullable|numeric|min:0|max:100',
            'override_late_penalty' => 'nullable|numeric|min:0',
            'override_absent_penalty' => 'nullable|numeric|min:0',
            'override_agency_fee_percent' => 'nullable|numeric|min:0|max:100',
            'override_overtime_multiplier' => 'nullable|numeric|min:1|max:5',
        ]);
        
        $employee->jobs()->updateExistingPivot($jobId, $validated);
        
        return response()->json([
            'message' => 'Job overrides updated',
            'settings' => $employee->getJobSettings($jobId)
        ]);
    }

    /**
     * Remove a job from an employee
     */
    public function removeJob($employeeId, $jobId)
    {
        $employee = Employee::findOrFail($employeeId);
        
        if (!$employee->hasJob($jobId)) {
            return response()->json(['error' => 'Job not assigned to this employee'], 404);
        }
        
        // Check if this was the primary job
        $wasPrimary = $employee->jobs()
            ->where('jobs.id', $jobId)
            ->wherePivot('is_primary', true)
            ->exists();
        
        $employee->jobs()->detach($jobId);
        
        // If this was primary and there are other jobs, make one of them primary
        if ($wasPrimary && $employee->jobs()->count() > 0) {
            $firstJob = $employee->jobs()->first();
            $employee->jobs()->updateExistingPivot($firstJob->id, ['is_primary' => true]);
        }
        
        return response()->json(['message' => 'Job removed from employee']);
    }

    /**
     * Set a job as primary for an employee
     */
    public function setPrimaryJob($employeeId, $jobId)
    {
        $employee = Employee::findOrFail($employeeId);
        
        if (!$employee->hasJob($jobId)) {
            return response()->json(['error' => 'Job not assigned to this employee'], 404);
        }
        
        // Unset all as primary
        $employee->jobs()->updateExistingPivot(
            $employee->jobs()->pluck('jobs.id')->toArray(),
            ['is_primary' => false]
        );
        
        // Set this one as primary
        $employee->jobs()->updateExistingPivot($jobId, ['is_primary' => true]);
        
        return response()->json(['message' => 'Primary job updated']);
    }
}
