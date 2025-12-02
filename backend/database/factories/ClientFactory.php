<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        return [
            'company_name' => fake()->company(),
            'tin_number' => fake()->numerify('##########'),
            'contact_person' => fake()->name(),
            'contact_phone' => '+251' . fake()->numberBetween(900000000, 999999999),
            'billing_cycle' => fake()->randomElement(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
            'address_details' => [
                'city' => fake()->city(),
                'subcity' => fake()->randomElement(['Bole', 'Yeka', 'Kirkos', 'Arada']),
                'woreda' => fake()->numberBetween(1, 15),
            ],
        ];
    }
}
