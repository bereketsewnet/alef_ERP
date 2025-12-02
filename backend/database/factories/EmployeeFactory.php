<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\JobRole;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        return [
            'employee_code' => 'EMP' . fake()->unique()->numberBetween(1000, 9999),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'phone_number' => '+251' . fake()->numberBetween(900000000, 999999999),
            'job_role_id' => JobRole::factory(),
            'status' => 'ACTIVE',
            'hire_date' => fake()->dateTimeBetween('-2 years', 'now'),
            'probation_end_date' => fake()->dateTimeBetween('-1 year', '+3 months'),
            'bank_account_number' => fake()->bankAccountNumber(),
            'bank_name' => fake()->randomElement(['CBE', 'Awash Bank', 'Dashen Bank', 'Bank of Abyssinia']),
        ];
    }
}
