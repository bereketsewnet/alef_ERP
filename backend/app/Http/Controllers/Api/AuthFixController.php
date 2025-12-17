<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;

class AuthFixController extends Controller
{
    /**
     * Fix missing User accounts for existing Employees
     */
    public function generateUsersForEmployees()
    {
        $employees = Employee::whereDoesntHave('user')->get();
        $createdCount = 0;
        $linkedCount = 0;

        foreach ($employees as $employee) {
            try {
                DB::transaction(function () use ($employee, &$createdCount, &$linkedCount) {
                    // Check if user exists with same phone
                    $existingUser = User::where('phone_number', $employee->phone_number)->first();

                    if ($existingUser) {
                        $existingUser->update(['employee_id' => $employee->id]);
                        $linkedCount++;
                    } else {
                        // Create new user
                        $username = strtolower($employee->first_name . '.' . $employee->last_name);
                        
                        // Ensure unique username
                        $originalUsername = $username;
                        $counter = 1;
                        while (User::where('username', $username)->exists()) {
                            $username = $originalUsername . $counter;
                            $counter++;
                        }

                        User::create([
                            'username' => $username,
                            'email' => $employee->email ?? ($username . '@example.com'),
                            'phone_number' => $employee->phone_number,
                            'password' => Hash::make('password'), // Default password
                            'role' => 'FIELD_STAFF',
                            'is_active' => true,
                            'employee_id' => $employee->id,
                        ]);
                        $createdCount++;
                    }
                });
            } catch (\Exception $e) {
                // Log error but continue
                logger()->error("Failed to create user for employee {$employee->id}: " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Sync complete',
            'created' => $createdCount,
            'linked' => $linkedCount,
            'total_processed' => $employees->count()
        ]);
    }
}
