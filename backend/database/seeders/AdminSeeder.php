<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Create all admin/office accounts by role.
     * Roles: Owner (Super Admin), GM, HR, Finance, Operations, Marketing, Procurement.
     */
    public function run(): void
    {
        $accounts = [
            [
                'username' => 'owner',
                'email' => 'owner@alefdelta.com',
                'password' => 'owner123',
                'role' => 'OWNER',
            ],
            [
                'username' => 'gm',
                'email' => 'gm@alefdelta.com',
                'password' => 'gm123',
                'role' => 'GM',
            ],
            [
                'username' => 'hr',
                'email' => 'hr@alefdelta.com',
                'password' => 'hr123',
                'role' => 'HR',
            ],
            [
                'username' => 'finance',
                'email' => 'finance@alefdelta.com',
                'password' => 'finance123',
                'role' => 'FINANCE',
            ],
            [
                'username' => 'operations',
                'email' => 'operations@alefdelta.com',
                'password' => 'operations123',
                'role' => 'OPERATIONS',
            ],
            [
                'username' => 'marketing',
                'email' => 'marketing@alefdelta.com',
                'password' => 'marketing123',
                'role' => 'MARKETING',
            ],
            [
                'username' => 'procurement',
                'email' => 'procurement@alefdelta.com',
                'password' => 'procurement123',
                'role' => 'PROCUREMENT',
            ],
        ];

        foreach ($accounts as $acc) {
            $user = User::firstOrCreate(
                ['email' => $acc['email']],
                [
                    'username' => $acc['username'],
                    'password' => Hash::make($acc['password']),
                    'role' => $acc['role'],
                    'is_active' => true,
                ]
            );
            if (!$user->wasRecentlyCreated) {
                $user->update([
                    'username' => $acc['username'],
                    'password' => Hash::make($acc['password']),
                    'role' => $acc['role'],
                    'is_active' => true,
                ]);
            }
        }

        // If old admin@alefdelta.com exists (from previous seeder), make it OWNER and keep password in sync
        $legacy = User::where('email', 'admin@alefdelta.com')->first();
        if ($legacy) {
            $legacy->update([
                'role' => 'OWNER',
                'password' => Hash::make('owner123'),
                'is_active' => true,
            ]);
        }

        echo "Created/updated admin accounts: Owner, GM, HR, Finance, Operations, Marketing, Procurement.\n";
    }
}
