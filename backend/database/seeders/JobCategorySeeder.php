<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JobCategory;

class JobCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Security Services',
                'code' => 'SEC',
                'description' => 'Security guards, watchmen, and security personnel',
                'is_active' => true,
            ],
            [
                'name' => 'Cleaning Services',
                'code' => 'CLN',
                'description' => 'Janitors, cleaners, and maintenance staff',
                'is_active' => true,
            ],
            [
                'name' => 'Hospitality',
                'code' => 'HSP',
                'description' => 'Waiters, cooks, and hospitality staff',
                'is_active' => true,
            ],
            [
                'name' => 'Construction',
                'code' => 'CST',
                'description' => 'Construction workers and laborers',
                'is_active' => true,
            ],
            [
                'name' => 'Administrative',
                'code' => 'ADM',
                'description' => 'Office staff and administrative personnel',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            JobCategory::firstOrCreate(
                ['code' => $category['code']],
                $category
            );
        }

        echo "Created " . count($categories) . " job categories.\n";
    }
}

