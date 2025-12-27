<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Create Super Admin User (always create, even if exists)
        $admin = User::firstOrCreate(
            ['email' => 'admin@alefdelta.com'],
            [
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'role' => 'SUPER_ADMIN',
                'is_active' => true,
            ]
        );
        
        // Update password if user already exists (in case it was changed)
        if ($admin->wasRecentlyCreated === false) {
            $admin->update([
                'password' => Hash::make('admin123'),
                'is_active' => true,
            ]);
        }

        // Create HR Manager
        $hr = User::firstOrCreate(
            ['email' => 'hr@alefdelta.com'],
            [
                'username' => 'hr_manager',
                'password' => Hash::make('hr123'),
                'role' => 'HR_MANAGER',
                'is_active' => true,
            ]
        );
        
        if ($hr->wasRecentlyCreated === false) {
            $hr->update([
                'password' => Hash::make('hr123'),
                'is_active' => true,
            ]);
        }

        // Create Finance User
        $finance = User::firstOrCreate(
            ['email' => 'finance@alefdelta.com'],
            [
                'username' => 'finance',
                'password' => Hash::make('finance123'),
                'role' => 'FINANCE',
                'is_active' => true,
            ]
        );
        
        if ($finance->wasRecentlyCreated === false) {
            $finance->update([
                'password' => Hash::make('finance123'),
                'is_active' => true,
            ]);
        }
        
        echo "Created/Updated admin accounts:\n";
        echo "  - Admin: admin@alefdelta.com / admin123\n";
        echo "  - HR: hr@alefdelta.com / hr123\n";
        echo "  - Finance: finance@alefdelta.com / finance123\n";
    }
}
