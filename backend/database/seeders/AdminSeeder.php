<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Create Super Admin User
        User::firstOrCreate(
            ['email' => 'admin@alefdelta.com'],
            [
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'role' => 'SUPER_ADMIN',
                'is_active' => true,
            ]
        );

        // Create HR Manager
        User::firstOrCreate(
            ['email' => 'hr@alefdelta.com'],
            [
                'username' => 'hr_manager',
                'password' => Hash::make('hr123'),
                'role' => 'HR_MANAGER',
                'is_active' => true,
            ]
        );

        // Create Finance User
        User::firstOrCreate(
            ['email' => 'finance@alefdelta.com'],
            [
                'username' => 'finance',
                'password' => Hash::make('finance123'),
                'role' => 'FINANCE',
                'is_active' => true,
            ]
        );
    }
}
