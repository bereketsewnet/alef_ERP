<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use OpenApi\Annotations as OA;

class UserController extends Controller
{
    /**
     * @OA\Get(
     *     path="/users",
     *     summary="List all users (Admin only)",
     *     tags={"User Management"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="role", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="List of users")
     * )
     */
    public function index(Request $request)
    {
        $this->authorizeAdmin();

        $query = User::with('employee');

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('username', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('phone_number', 'like', '%' . $request->search . '%');
            });
        }

        return response()->json($query->paginate(20));
    }

    /**
     * @OA\Post(
     *     path="/users",
     *     summary="Create a new user (Admin only)",
     *     tags={"User Management"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"username", "email", "password", "role"},
     *             @OA\Property(property="username", type="string"),
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="phone_number", type="string"),
     *             @OA\Property(property="password", type="string", minLength=6),
     *             @OA\Property(property="role", type="string", enum={"SUPER_ADMIN", "OPS_MANAGER", "HR_MANAGER", "FINANCE", "SITE_SUPERVISOR", "FIELD_STAFF"}),
     *             @OA\Property(property="employee_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=201, description="User created")
     * )
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $request->validate([
            'username' => 'required|string|unique:users',
            'email' => 'required|string|email|unique:users',
            'phone_number' => 'nullable|string|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:SUPER_ADMIN,OPS_MANAGER,HR_MANAGER,FINANCE,SITE_SUPERVISOR,FIELD_STAFF',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'employee_id' => $request->employee_id,
            'is_active' => true,
        ]);

        return response()->json($user, 201);
    }

    /**
     * @OA\Get(
     *     path="/users/{id}",
     *     summary="Get user details (Admin only)",
     *     tags={"User Management"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="User details")
     * )
     */
    public function show($id)
    {
        $this->authorizeAdmin();
        return response()->json(User::with('employee')->findOrFail($id));
    }

    /**
     * @OA\Put(
     *     path="/users/{id}",
     *     summary="Update user details (Admin only)",
     *     tags={"User Management"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="phone_number", type="string"),
     *             @OA\Property(property="role", type="string"),
     *             @OA\Property(property="is_active", type="boolean"),
     *             @OA\Property(property="employee_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=200, description="User updated")
     * )
     */
    public function update(Request $request, $id)
    {
        $this->authorizeAdmin();

        $user = User::findOrFail($id);

        $request->validate([
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone_number' => 'nullable|string|unique:users,phone_number,' . $id,
            'role' => 'sometimes|in:SUPER_ADMIN,OPS_MANAGER,HR_MANAGER,FINANCE,SITE_SUPERVISOR,FIELD_STAFF',
            'employee_id' => 'nullable|exists:employees,id',
            'is_active' => 'sometimes|boolean',
        ]);

        $user->update($request->all());

        return response()->json($user);
    }

    /**
     * @OA\Post(
     *     path="/users/{id}/reset-password",
     *     summary="Reset user password (Admin only)",
     *     tags={"User Management"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"new_password"},
     *             @OA\Property(property="new_password", type="string", minLength=6)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Password reset successfully")
     * )
     */
    public function resetPassword(Request $request, $id)
    {
        $this->authorizeAdmin();

        $request->validate([
            'new_password' => 'required|string|min:6',
        ]);

        $user = User::findOrFail($id);
        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json(['message' => 'Password reset successfully']);
    }

    private function authorizeAdmin()
    {
        if (auth()->user()->role !== 'SUPER_ADMIN') {
            abort(403, 'Unauthorized action.');
        }
    }
}
