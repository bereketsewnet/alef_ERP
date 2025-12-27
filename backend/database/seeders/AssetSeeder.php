<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Asset;

class AssetSeeder extends Seeder
{
    public function run(): void
    {
        $assets = [
            [
                'asset_code' => 'AST-001',
                'name' => 'Security Uniform Set',
                'category' => 'UNIFORM',
                'condition' => 'GOOD',
                'purchase_date' => now()->subMonths(6),
                'value' => 500.00,
            ],
            [
                'asset_code' => 'AST-002',
                'name' => 'Cleaning Equipment Set',
                'category' => 'EQUIPMENT',
                'condition' => 'GOOD',
                'purchase_date' => now()->subMonths(4),
                'value' => 1200.00,
            ],
            [
                'asset_code' => 'AST-003',
                'name' => 'Mobile Phone - Samsung',
                'category' => 'ELECTRONICS',
                'condition' => 'EXCELLENT',
                'purchase_date' => now()->subMonths(2),
                'value' => 3500.00,
            ],
            [
                'asset_code' => 'AST-004',
                'name' => 'Security Radio',
                'category' => 'ELECTRONICS',
                'condition' => 'GOOD',
                'purchase_date' => now()->subMonths(8),
                'value' => 800.00,
            ],
            [
                'asset_code' => 'AST-005',
                'name' => 'Cleaning Cart',
                'category' => 'EQUIPMENT',
                'condition' => 'FAIR',
                'purchase_date' => now()->subMonths(12),
                'value' => 2500.00,
            ],
            [
                'asset_code' => 'AST-006',
                'name' => 'Flashlight Set',
                'category' => 'EQUIPMENT',
                'condition' => 'GOOD',
                'purchase_date' => now()->subMonths(3),
                'value' => 300.00,
            ],
            [
                'asset_code' => 'AST-007',
                'name' => 'First Aid Kit',
                'category' => 'MEDICAL',
                'condition' => 'GOOD',
                'purchase_date' => now()->subMonths(1),
                'value' => 450.00,
            ],
        ];

        foreach ($assets as $asset) {
            Asset::firstOrCreate(
                ['asset_code' => $asset['asset_code']],
                $asset
            );
        }

        echo "Created " . count($assets) . " assets.\n";
    }
}

