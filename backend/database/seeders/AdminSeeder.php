<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Create the single production owner account.
     */
    public function run(): void
    {
        $email = env('PRODUCTION_ADMIN_EMAIL');
        $password = env('PRODUCTION_ADMIN_PASSWORD');

        if (!$email || !$password) {
            throw new \RuntimeException('PRODUCTION_ADMIN_EMAIL and PRODUCTION_ADMIN_PASSWORD must be configured.');
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'username' => 'trading',
                'password' => Hash::make($password),
                'role' => 'OWNER',
                'is_active' => true,
                'employee_id' => null,
                'phone_number' => null,
            ]
        );

        echo "Created/updated the production OWNER account.\n";
    }
}
