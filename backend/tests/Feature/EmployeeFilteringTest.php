<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Job;
use App\Models\JobCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeFilteringTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private JobCategory $securityCategory;
    private JobCategory $cleanerCategory;
    private Job $securityJob;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::create([
            'username' => 'employee_filter_owner',
            'email' => 'employee-filter-owner@example.com',
            'password' => bcrypt('password'),
            'role' => 'OWNER',
            'is_active' => true,
        ]);
        $this->actingAs($this->owner, 'api');

        $this->securityCategory = JobCategory::create([
            'name' => 'Security',
            'code' => 'SEC',
            'is_active' => true,
        ]);
        $this->cleanerCategory = JobCategory::create([
            'name' => 'Cleaner',
            'code' => 'CLN',
            'is_active' => true,
        ]);
        $this->securityJob = Job::create([
            'category_id' => $this->securityCategory->id,
            'job_code' => 'SEC-001',
            'job_name' => 'Security Guard',
            'pay_type' => 'MONTHLY',
            'base_salary' => 5000,
            'is_active' => true,
        ]);
    }

    public function test_employee_list_paginates_and_reports_accurate_totals(): void
    {
        foreach (range(1, 31) as $number) {
            $this->createEmployee("Employee {$number}", $number);
        }

        $firstPage = $this->getJson('/api/employees?per_page=25&page=1');
        $firstPage->assertOk()
            ->assertJsonCount(25, 'data')
            ->assertJsonPath('current_page', 1)
            ->assertJsonPath('last_page', 2)
            ->assertJsonPath('total', 31);

        $secondPage = $this->getJson('/api/employees?per_page=25&page=2');
        $secondPage->assertOk()
            ->assertJsonCount(6, 'data')
            ->assertJsonPath('current_page', 2);
    }

    public function test_category_filters_include_explicit_and_job_derived_categories(): void
    {
        $explicit = $this->createEmployee('Explicit Security', 101, $this->securityCategory->id);
        $jobDerived = $this->createEmployee('Assigned Security', 102);
        $unassigned = $this->createEmployee('No Category', 103);
        $jobDerived->jobs()->attach($this->securityJob->id, ['is_primary' => true]);

        $categoryResult = $this->getJson('/api/employees?category_id=' . $this->securityCategory->id . '&per_page=25');
        $categoryResult->assertOk();
        $categoryIds = collect($categoryResult->json('data'))->pluck('id')->all();

        $this->assertContains($explicit->id, $categoryIds);
        $this->assertContains($jobDerived->id, $categoryIds);
        $this->assertNotContains($unassigned->id, $categoryIds);

        $noneResult = $this->getJson('/api/employees?category_id=none&per_page=25');
        $noneResult->assertOk();
        $noneIds = collect($noneResult->json('data'))->pluck('id')->all();

        $this->assertSame([$unassigned->id], $noneIds);
    }

    public function test_job_filter_uses_employee_job_assignments(): void
    {
        $assigned = $this->createEmployee('Assigned Employee', 201);
        $notAssigned = $this->createEmployee('Other Employee', 202);
        $assigned->jobs()->attach($this->securityJob->id, ['is_primary' => true]);

        $response = $this->getJson('/api/employees?job_id=' . $this->securityJob->id . '&per_page=25');
        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $assigned->id)
            ->assertJsonPath('data.0.jobs.0.id', $this->securityJob->id);

        $this->assertNotSame($notAssigned->id, $response->json('data.0.id'));
    }

    public function test_amharic_employee_name_can_be_found_with_latin_phonetic_spelling(): void
    {
        $employee = $this->createEmployee('ሀይሌ', 301, null, 'ቲቤ በልሳ');
        $this->createEmployee('Different', 302);

        foreach (['hayle', 'haile', 'hayle..', 'tibe belsa', 'ሀይሌ'] as $search) {
            $response = $this->getJson('/api/employees?per_page=25&search=' . urlencode($search));
            $response->assertOk();

            $ids = collect($response->json('data'))->pluck('id')->all();
            $this->assertContains($employee->id, $ids, "Failed to match employee using search: {$search}");
        }
    }

    private function createEmployee(
        string $firstName,
        int $number,
        ?int $categoryId = null,
        string $lastName = 'Test'
    ): Employee
    {
        return Employee::create([
            'employee_code' => 'TEST-' . str_pad((string) $number, 4, '0', STR_PAD_LEFT),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => "employee{$number}@example.com",
            'phone_number' => '+251900' . str_pad((string) $number, 6, '0', STR_PAD_LEFT),
            'status' => 'active',
            'hire_date' => '2026-01-01',
            'job_role_id' => null,
            'job_category_id' => $categoryId,
        ]);
    }
}
