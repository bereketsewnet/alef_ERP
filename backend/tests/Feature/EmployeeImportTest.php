<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\JobCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class EmployeeImportTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private JobCategory $driver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::create([
            'username' => 'employee-import-owner',
            'email' => 'employee-import-owner@example.com',
            'password' => bcrypt('password'),
            'role' => 'OWNER',
            'is_active' => true,
        ]);
        $this->driver = JobCategory::create([
            'name' => 'Driver',
            'code' => 'DRIVER',
            'is_active' => true,
        ]);
    }

    public function test_legacy_driver_workbook_imports_rows_and_reports_errors_independently(): void
    {
        $file = $this->workbook([
            ['Name', 'Phone', 'Hired Date'],
            ['አበበ ከበደ', '0911234567', '10/01/16'],
            ['Missing Phone Driver', '-', ''],
            ['አበበ ከበደ', '0911234567', '10/01/16'],
        ]);

        $response = $this->actingAs($this->owner, 'api')->post('/api/employees/import', [
            'file' => $file,
            'default_category_id' => $this->driver->id,
            'default_calendar' => 'EC',
        ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('summary.created', 1)
            ->assertJsonPath('summary.unchanged', 1)
            ->assertJsonPath('summary.errors', 1)
            ->assertJsonPath('rows.0.result', 'CREATED')
            ->assertJsonPath('rows.1.result', 'ERROR')
            ->assertJsonPath('rows.1.column', 'phone_number')
            ->assertJsonPath('rows.2.result', 'UNCHANGED');

        $employee = Employee::firstOrFail();
        $this->assertSame('አበበ', $employee->first_name);
        $this->assertSame('ከበደ', $employee->last_name);
        $this->assertSame('+251911234567', $employee->phone_number);
        $this->assertSame('2023-09-21', $employee->hire_date->toDateString());
        $this->assertSame($this->driver->id, $employee->job_category_id);
        $this->assertDatabaseHas('users', ['employee_id' => $employee->id, 'phone_number' => '+251911234567']);
    }

    public function test_valid_rows_continue_and_errors_identify_the_exact_column(): void
    {
        $response = $this->actingAs($this->owner, 'api')->post('/api/employees/import', [
            'file' => $this->workbook([
                ['first_name', 'phone_number', 'email', 'status', 'category'],
                ['Valid', '0911111111', 'valid@example.com', 'ACTIVE', 'Driver'],
                ['Bad Email', '0922222222', 'not-an-email', 'ACTIVE', 'Driver'],
                ['Also Valid', '0933333333', '', 'PROBATION', 'Driver'],
            ]),
            'default_calendar' => 'GC',
        ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('summary.created', 2)
            ->assertJsonPath('summary.errors', 1)
            ->assertJsonPath('rows.1.result', 'ERROR')
            ->assertJsonPath('rows.1.column', 'email')
            ->assertJsonPath('rows.1.value', 'not-an-email')
            ->assertJsonPath('rows.2.result', 'CREATED');

        $this->assertDatabaseHas('employees', ['phone_number' => '+251911111111']);
        $this->assertDatabaseHas('employees', ['phone_number' => '+251933333333']);
        $this->assertDatabaseMissing('employees', ['phone_number' => '+251922222222']);
    }

    public function test_existing_employee_is_updated_by_code_and_password_is_preserved(): void
    {
        $employee = Employee::create([
            'employee_code' => 'EMP00042',
            'first_name' => 'Old',
            'last_name' => 'Name',
            'email' => 'old@example.com',
            'phone_number' => '+251911000000',
            'status' => 'active',
            'hire_date' => '2025-01-01',
            'job_category_id' => null,
        ]);
        $user = User::create([
            'employee_id' => $employee->id,
            'username' => 'emp00042',
            'email' => 'old@example.com',
            'phone_number' => '+251911000000',
            'password' => bcrypt('keep-this-password'),
            'role' => 'FIELD_STAFF',
            'is_active' => true,
        ]);
        $passwordHash = $user->password;

        $response = $this->actingAs($this->owner, 'api')->post('/api/employees/import', [
            'file' => $this->workbook([
                ['employee_code', 'first_name', 'last_name', 'email', 'phone_number', 'status', 'category', 'hire_date', 'date_calendar'],
                ['EMP00042', 'New', 'Person', 'new@example.com', '0922000000', 'PROBATION', 'Driver', '2026-02-03', 'GC'],
            ]),
            'default_calendar' => 'GC',
        ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('summary.updated', 1)
            ->assertJsonPath('summary.created', 0)
            ->assertJsonPath('rows.0.result', 'UPDATED')
            ->assertJsonFragment(['column' => 'phone_number', 'old' => '+251911000000', 'new' => '+251922000000'])
            ->assertJsonFragment(['column' => 'category', 'old' => 'None', 'new' => 'Driver']);

        $employee->refresh();
        $user->refresh();
        $this->assertSame('New', $employee->first_name);
        $this->assertSame('+251922000000', $employee->phone_number);
        $this->assertSame($this->driver->id, $employee->job_category_id);
        $this->assertSame($passwordHash, $user->password);
        $this->assertSame('+251922000000', $user->phone_number);
        $this->assertSame('new@example.com', $user->email);

        $secondResponse = $this->actingAs($this->owner, 'api')->post('/api/employees/import', [
            'file' => $this->workbook([
                ['employee_code', 'first_name', 'phone_number'],
                ['EMP00042', 'New', '0922000000'],
            ]),
            'default_calendar' => 'GC',
        ], ['Accept' => 'application/json']);

        $secondResponse->assertOk()
            ->assertJsonPath('summary.unchanged', 1)
            ->assertJsonPath('rows.0.result', 'UNCHANGED');
        $this->assertSame('Person', $employee->fresh()->last_name);
    }

    public function test_invalid_spreadsheet_structure_returns_detected_and_missing_columns(): void
    {
        $response = $this->actingAs($this->owner, 'api')->post('/api/employees/import', [
            'file' => $this->workbook([
                ['first_name', 'email'],
                ['Abebe', 'abebe@example.com'],
            ]),
            'default_calendar' => 'GC',
        ], ['Accept' => 'application/json']);

        $response->assertStatus(422)
            ->assertJsonPath('structure.missing.0', 'phone_number (or Phone)')
            ->assertJsonPath('structure.detected.0', 'first_name')
            ->assertJsonStructure(['errors' => ['file']]);
    }

    public function test_template_and_documentation_bundle_can_be_downloaded(): void
    {
        $this->actingAs($this->owner, 'api')
            ->get('/api/employees/import/template')
            ->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $this->actingAs($this->owner, 'api')
            ->get('/api/employees/import/bundle')
            ->assertOk()
            ->assertHeader('content-type', 'application/zip');
    }

    private function workbook(array $rows): UploadedFile
    {
        $book = new Spreadsheet();
        $book->getActiveSheet()->fromArray($rows, null, 'A1');
        $path = tempnam(sys_get_temp_dir(), 'employee_import_test_') . '.xlsx';
        (new Xlsx($book))->save($path);

        return new UploadedFile($path, 'drivers.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
    }
}
