<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Client;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        $clients = [
            [
                'company_name' => 'Ethiopian Commercial Bank',
                'tin_number' => 'TIN001234567',
                'contact_person' => 'Ato Bekele Mulugeta',
                'contact_phone' => '+251911234567',
                'billing_cycle' => 'MONTHLY',
                'address_details' => [
                    'street' => 'Ras Abebe Aregay Street',
                    'city' => 'Addis Ababa',
                    'subcity' => 'Arada',
                    'building' => 'ECB Headquarters',
                ],
            ],
            [
                'company_name' => 'Hilton Addis Ababa',
                'tin_number' => 'TIN002345678',
                'contact_person' => 'Ms. Sarah Johnson',
                'contact_phone' => '+251922345678',
                'billing_cycle' => 'MONTHLY',
                'address_details' => [
                    'street' => 'Menelik II Avenue',
                    'city' => 'Addis Ababa',
                    'subcity' => 'Arada',
                    'building' => 'Hilton Hotel',
                ],
            ],
            [
                'company_name' => 'Dangote Cement Factory',
                'tin_number' => 'TIN003456789',
                'contact_person' => 'Eng. Mohammed Ali',
                'contact_phone' => '+251933456789',
                'billing_cycle' => 'WEEKLY',
                'address_details' => [
                    'street' => 'Industrial Zone',
                    'city' => 'Addis Ababa',
                    'subcity' => 'Akaki Kality',
                    'building' => 'Dangote Factory',
                ],
            ],
            [
                'company_name' => 'Sheraton Addis',
                'tin_number' => 'TIN004567890',
                'contact_person' => 'Mr. Daniel Tekle',
                'contact_phone' => '+251944567890',
                'billing_cycle' => 'MONTHLY',
                'address_details' => [
                    'street' => 'Taitu Street',
                    'city' => 'Addis Ababa',
                    'subcity' => 'Arada',
                    'building' => 'Sheraton Hotel',
                ],
            ],
            [
                'company_name' => 'Bole International Airport',
                'tin_number' => 'TIN005678901',
                'contact_person' => 'Ato Yonas Tadesse',
                'contact_phone' => '+251955678901',
                'billing_cycle' => 'MONTHLY',
                'address_details' => [
                    'street' => 'Airport Road',
                    'city' => 'Addis Ababa',
                    'subcity' => 'Bole',
                    'building' => 'Terminal Building',
                ],
            ],
        ];

        foreach ($clients as $client) {
            Client::firstOrCreate(
                ['tin_number' => $client['tin_number']],
                $client
            );
        }

        echo "Created " . count($clients) . " clients.\n";
    }
}

