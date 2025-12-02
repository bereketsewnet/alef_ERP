<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
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

    public function show($id)
    {
        $employee = Employee::with(['jobRole.department', 'user', 'assetAssignments.asset'])->findOrFail($id);
        return response()->json($employee);
    }

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
