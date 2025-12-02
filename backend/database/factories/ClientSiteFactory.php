<?php

namespace Database\Factories;

use App\Models\ClientSite;
use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClientSiteFactory extends Factory
{
    protected $model = ClientSite::class;

    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'site_name' => fake()->company() . ' - ' . fake()->randomElement(['Main Office', 'Branch', 'Warehouse', 'Factory']),
            'latitude' => fake()->latitude(8.5, 9.5), // Addis Ababa area
            'longitude' => fake()->longitude(38.5, 39.0),
            'geo_radius_meters' => 100,
            'site_contact_phone' => '+251' . fake()->numberBetween(900000000, 999999999),
        ];
    }
}
