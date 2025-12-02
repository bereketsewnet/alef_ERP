<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;
use Illuminate\Support\Facades\Hash;

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
            $query->where(function($q) use ($request) {
                $q->where('first_name', 'like', '%' . $request->search . '%')
                  ->orWhere('last_name', 'like', '%' . $request->search . '%')
                  ->orWhere('employee_code', 'like', '%' . $request->search . '%');
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
            'employee_code' => 'required|string|unique:employees',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'phone_number' => 'required|string',
            'job_role_id' => 'required|exists:job_roles,id',
            'hire_date' => 'required|date',
            'guarantor_details' => 'nullable|array',
        ]);

        $employee = Employee::create($request->all());

        return response()->json($employee, 201);
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
            'employee_code' => 'sometimes|string|unique:employees,employee_code,' . $id,
            'first_name' => 'sometimes|string',
            'last_name' => 'sometimes|string',
            'phone_number' => 'sometimes|string',
            'job_role_id' => 'sometimes|exists:job_roles,id',
            'status' => 'sometimes|in:ACTIVE,TERMINATED,ON_LEAVE',
        ]);

        $employee->update($request->all());

        return response()->json($employee);
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
}
