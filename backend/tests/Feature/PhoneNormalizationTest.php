<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhoneNormalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_local_phone_is_stored_canonically_and_can_be_used_for_login(): void
    {
        $user = User::create([
            'username' => 'phone-login-test',
            'email' => 'phone-login-test@example.com',
            'phone_number' => '0911234567',
            'password' => bcrypt('password123'),
            'role' => 'FIELD_STAFF',
            'is_active' => true,
        ]);

        $this->assertSame('+251911234567', $user->fresh()->phone_number);

        $this->postJson('/api/auth/login', [
            'login' => '0911234567',
            'password' => 'password123',
        ])->assertOk()->assertJsonStructure(['access_token', 'user']);
    }

    public function test_employee_phone_update_normalizes_and_syncs_the_linked_login(): void
    {
        $owner = User::create([
            'username' => 'phone-owner',
            'email' => 'phone-owner@example.com',
            'password' => bcrypt('password123'),
            'role' => 'OWNER',
            'is_active' => true,
        ]);
        $employee = Employee::create([
            'employee_code' => 'PHONE-001',
            'first_name' => 'Phone',
            'last_name' => 'Test',
            'phone_number' => '0911000001',
            'status' => 'active',
            'hire_date' => '2026-01-01',
        ]);
        $login = User::create([
            'employee_id' => $employee->id,
            'username' => 'phone-employee',
            'email' => 'phone-employee@example.com',
            'phone_number' => '0911000001',
            'password' => bcrypt('password123'),
            'role' => 'FIELD_STAFF',
            'is_active' => true,
        ]);

        $this->actingAs($owner, 'api')
            ->putJson('/api/employees/' . $employee->id, ['phone_number' => '0922000002'])
            ->assertOk()
            ->assertJsonPath('data.phone_number', '+251922000002');

        $this->assertSame('+251922000002', $employee->fresh()->phone_number);
        $this->assertSame('+251922000002', $login->fresh()->phone_number);
    }

    public function test_employee_search_accepts_the_local_phone_prefix(): void
    {
        $owner = User::create([
            'username' => 'phone-search-owner',
            'email' => 'phone-search-owner@example.com',
            'password' => bcrypt('password123'),
            'role' => 'OWNER',
            'is_active' => true,
        ]);
        $employee = Employee::create([
            'employee_code' => 'PHONE-002',
            'first_name' => 'Search',
            'last_name' => 'Phone',
            'phone_number' => '0933445566',
            'status' => 'active',
            'hire_date' => '2026-01-01',
        ]);

        $response = $this->actingAs($owner, 'api')
            ->getJson('/api/employees?search=093344&per_page=25')
            ->assertOk();

        $this->assertContains($employee->id, collect($response->json('data'))->pluck('id')->all());
    }
}
