<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\EmployeeImportRowException;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\JobCategory;
use App\Models\User;
use App\Support\EmployeeHireDate;
use App\Support\EthiopianPhoneNumber;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\NamedRange;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use ZipArchive;

class EmployeeImportController extends Controller
{
    private const ROLES = ['OWNER', 'GM', 'HR', 'OPERATIONS'];
    private const STATUSES = ['active', 'probation', 'inactive', 'terminated'];
    private const MAX_ROWS = 5000;

    /** @var array<string, string> */
    private const HEADER_ALIASES = [
        'name' => 'name',
        'full_name' => 'name',
        'employee_name' => 'name',
        'employee_code' => 'employee_code',
        'employee_id' => 'employee_code',
        'id' => 'employee_code',
        'first_name' => 'first_name',
        'firstname' => 'first_name',
        'last_name' => 'last_name',
        'lastname' => 'last_name',
        'email' => 'email',
        'phone' => 'phone_number',
        'phone_number' => 'phone_number',
        'mobile' => 'phone_number',
        'status' => 'status',
        'category' => 'category',
        'employee_category' => 'category',
        'hire_date' => 'hire_date',
        'hired_date' => 'hire_date',
        'date_hired' => 'hire_date',
        'date_calendar' => 'date_calendar',
        'calendar' => 'date_calendar',
    ];

    public function template()
    {
        $this->authorizeImport();

        return response()->streamDownload(function () {
            echo $this->templateBytes();
        }, 'employee_import_template.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function bundle()
    {
        $this->authorizeImport();
        File::ensureDirectoryExists(storage_path('fonts'));

        $zipPath = tempnam(sys_get_temp_dir(), 'employee_import_docs_');
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Could not create the employee import documentation package.');
        }

        $zip->addFromString('employee_import_template.xlsx', $this->templateBytes());
        $zip->addFromString('employee_import_guide_english.pdf', Pdf::loadView('employees.import_guide_en')->setPaper('a4')->output());
        $zip->addFromString('employee_import_guide_amharic.pdf', Pdf::loadView('employees.import_guide_am')->setPaper('a4')->output());
        $zip->close();

        return response()->download($zipPath, 'employee_import_complete_package.zip', [
            'Content-Type' => 'application/zip',
        ])->deleteFileAfterSend(true);
    }

    public function import(Request $request)
    {
        $this->authorizeImport();
        // Creating a linked login requires one password hash per employee.
        // Large, validated spreadsheets legitimately take longer than PHP's
        // normal web-request limit, while the frontend permits up to 10 min.
        @set_time_limit(600);
        $validated = $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
            'default_category_id' => 'nullable|integer|exists:job_categories,id',
            'default_calendar' => 'required|in:EC,GC',
        ]);

        try {
            $book = IOFactory::load($request->file('file')->getRealPath());
        } catch (\Throwable $exception) {
            return response()->json([
                'message' => 'The uploaded file could not be read as Excel or CSV. Download the standard template and try again.',
                'error' => $exception->getMessage(),
            ], 422);
        }

        $sheet = $book->getSheetByName('Employee Import') ?: $book->getActiveSheet();
        $highestRow = max(1, $sheet->getHighestDataRow());
        if ($highestRow - 1 > self::MAX_ROWS) {
            return response()->json(['message' => 'A maximum of ' . self::MAX_ROWS . ' employee rows can be imported at once.'], 422);
        }

        $highestColumn = $sheet->getHighestDataColumn();
        $rows = $sheet->rangeToArray("A1:{$highestColumn}{$highestRow}", null, true, true, false);
        if (!$rows || !array_filter($rows[0] ?? [])) {
            return response()->json(['message' => 'The spreadsheet is empty or has no header row.'], 422);
        }

        $headers = array_shift($rows);
        ['map' => $map, 'detected' => $detected, 'duplicates' => $duplicateColumns] = $this->analyzeHeaders($headers);
        $missing = [];
        if (!isset($map['first_name']) && !isset($map['name'])) {
            $missing[] = 'first_name (or Name)';
        }
        if (!isset($map['phone_number'])) {
            $missing[] = 'phone_number (or Phone)';
        }
        if ($missing !== [] || $duplicateColumns !== []) {
            $problems = [];
            if ($missing !== []) {
                $problems[] = 'Missing required column(s): ' . implode(', ', $missing) . '.';
            }
            if ($duplicateColumns !== []) {
                $problems[] = 'Duplicate/ambiguous column(s): ' . implode(', ', $duplicateColumns) . '.';
            }
            $message = 'Spreadsheet structure is invalid. ' . implode(' ', $problems) . ' Download the standard template and keep one header row.';
            return response()->json([
                'message' => $message,
                'errors' => ['file' => [$message]],
                'structure' => [
                    'required' => ['first_name or Name', 'phone_number or Phone'],
                    'optional' => ['employee_code', 'last_name', 'email', 'status', 'category', 'hire_date', 'date_calendar'],
                    'detected' => $detected,
                    'missing' => $missing,
                    'duplicate_columns' => $duplicateColumns,
                ],
            ], 422);
        }

        $results = [];
        $counts = ['created' => 0, 'updated' => 0, 'unchanged' => 0, 'errors' => 0, 'empty' => 0];
        foreach ($rows as $offset => $values) {
            $rowNumber = $offset + 2;
            if (!array_filter($values, fn ($value) => $this->filled($value))) {
                $counts['empty']++;
                continue;
            }

            $row = [];
            foreach ($map as $name => $index) {
                $row[$name] = $values[$index] ?? null;
            }

            try {
                $result = DB::transaction(fn () => $this->processRow(
                    $row,
                    $rowNumber,
                    $validated['default_category_id'] ?? null,
                    $validated['default_calendar']
                ));
                $counts[strtolower($result['result'])]++;
                $results[] = $result;
            } catch (\Throwable $exception) {
                $counts['errors']++;
                $rowErrors = $exception instanceof EmployeeImportRowException
                    ? $exception->errors
                    : [['column' => 'row', 'value' => null, 'message' => $exception->getMessage()]];
                $results[] = [
                    'row' => $rowNumber,
                    'name' => $this->rowName($row),
                    'phone_number' => trim((string) ($row['phone_number'] ?? '')),
                    'employee_code' => $this->filled($row['employee_code'] ?? null)
                        ? strtoupper(trim((string) $row['employee_code']))
                        : null,
                    'result' => 'ERROR',
                    'message' => $exception->getMessage(),
                    'column' => $rowErrors[0]['column'],
                    'value' => $rowErrors[0]['value'],
                    'errors' => $rowErrors,
                ];
            }
        }

        return response()->json([
            'message' => "Import finished: {$counts['created']} created, {$counts['updated']} updated, {$counts['unchanged']} unchanged, {$counts['errors']} errors.",
            'summary' => $counts,
            'rows' => $results,
        ]);
    }

    private function processRow(array $row, int $rowNumber, ?int $defaultCategoryId, string $defaultCalendar): array
    {
        [$firstName, $lastName, $hasLastName] = $this->names($row);
        $rawPhone = trim((string) ($row['phone_number'] ?? ''));
        $phone = EthiopianPhoneNumber::normalize($rawPhone);
        if (!is_string($phone) || preg_match('/^\+2519\d{8}$/', $phone) !== 1) {
            throw EmployeeImportRowException::forColumn('phone_number', $rawPhone, 'A valid Ethiopian mobile number is required. Use 09XXXXXXXX or +2519XXXXXXXX.');
        }

        $employeeCode = strtoupper(trim((string) ($row['employee_code'] ?? '')));
        $employee = null;
        if ($employeeCode !== '') {
            $employee = Employee::whereRaw('UPPER(employee_code) = ?', [$employeeCode])->lockForUpdate()->first();
            if (!$employee) {
                throw EmployeeImportRowException::forColumn('employee_code', $employeeCode, "Employee ID '{$employeeCode}' was not found. Leave it blank to create a new employee.");
            }
        } else {
            $employee = Employee::where('phone_number', $phone)->lockForUpdate()->first();
        }

        $email = strtolower(trim((string) ($row['email'] ?? '')));
        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            throw EmployeeImportRowException::forColumn('email', $email, 'Email is not valid. Leave it blank or use a valid email address.');
        }

        $phoneEmployee = Employee::where('phone_number', $phone)->first();
        $phoneUser = User::where('phone_number', $phone)->first();
        if (($phoneEmployee && $phoneEmployee->id !== $employee?->id)
            || ($phoneUser && (!$employee || $phoneUser->employee_id !== $employee->id))) {
            throw EmployeeImportRowException::forColumn('phone_number', $rawPhone, 'Phone number already belongs to another employee or user.');
        }

        if ($email !== '') {
            $emailEmployee = Employee::whereRaw('LOWER(email) = ?', [$email])->first();
            $emailUser = User::whereRaw('LOWER(email) = ?', [$email])->first();
            if (($emailEmployee && $emailEmployee->id !== $employee?->id)
                || ($emailUser && (!$employee || $emailUser->employee_id !== $employee->id))) {
                throw EmployeeImportRowException::forColumn('email', $email, 'Email already belongs to another employee or user.');
            }
        }

        $hasStatus = $this->filled($row['status'] ?? null);
        $status = $hasStatus ? strtolower(trim((string) $row['status'])) : ($employee?->status ?? 'active');
        if (!in_array($status, self::STATUSES, true)) {
            throw EmployeeImportRowException::forColumn('status', $row['status'] ?? null, 'Invalid status. Use ACTIVE, PROBATION, INACTIVE, or TERMINATED.');
        }

        $hasHireDate = $this->filled($row['hire_date'] ?? null);
        $calendar = $this->calendar($row['date_calendar'] ?? null, $defaultCalendar);
        try {
            $hireDate = $hasHireDate
                ? EmployeeHireDate::parse($row['hire_date'], $calendar)
                : ($employee?->hire_date?->toDateString() ?? now()->toDateString());
        } catch (\Throwable $exception) {
            throw EmployeeImportRowException::forColumn('hire_date', $row['hire_date'] ?? null, $exception->getMessage());
        }

        $hasCategory = $this->filled($row['category'] ?? null) || $defaultCategoryId !== null;
        $categoryId = $hasCategory
            ? $this->categoryId($row['category'] ?? null, $defaultCategoryId)
            : $employee?->job_category_id;

        if ($employee) {
            return $this->updateExistingEmployee(
                $employee,
                $rowNumber,
                $firstName,
                $lastName,
                $hasLastName,
                $email,
                $phone,
                $status,
                $hireDate,
                $categoryId,
                $hasStatus,
                $hasHireDate,
                $hasCategory
            );
        }

        $employeeCode = $this->nextEmployeeCode();
        $lastFour = substr(preg_replace('/\D/', '', $phone), -4);
        $temporaryPassword = $employeeCode . '-' . $lastFour;
        $username = strtolower($employeeCode);
        $loginEmail = $email !== '' ? $email : $username . '@alefdelta.com';

        $employee = Employee::create([
            'employee_code' => $employeeCode,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email !== '' ? $email : null,
            'phone_number' => $phone,
            'status' => $status,
            'hire_date' => $hireDate,
            'job_role_id' => null,
            'job_category_id' => $categoryId,
        ]);
        User::create([
            'employee_id' => $employee->id,
            'username' => $username,
            'email' => $loginEmail,
            'phone_number' => $phone,
            'password' => Hash::make($temporaryPassword),
            'role' => 'FIELD_STAFF',
            'is_active' => $status !== 'terminated',
        ]);

        return [
            'row' => $rowNumber,
            'name' => trim("{$firstName} {$lastName}"),
            'phone_number' => $phone,
            'employee_code' => $employeeCode,
            'result' => 'CREATED',
            'message' => "Employee created in " . ($calendar === 'EC' ? 'Ethiopian' : 'Gregorian') . " date mode. Initial password: {$temporaryPassword}",
            'changes' => [],
        ];
    }

    private function updateExistingEmployee(
        Employee $employee,
        int $rowNumber,
        string $firstName,
        string $lastName,
        bool $hasLastName,
        string $email,
        string $phone,
        string $status,
        string $hireDate,
        ?int $categoryId,
        bool $hasStatus,
        bool $hasHireDate,
        bool $hasCategory
    ): array {
        $desired = [
            'first_name' => $firstName,
            'phone_number' => $phone,
        ];
        if ($hasLastName) {
            $desired['last_name'] = $lastName;
        }
        if ($email !== '') {
            $desired['email'] = $email;
        }
        if ($hasStatus) {
            $desired['status'] = $status;
        }
        if ($hasHireDate) {
            $desired['hire_date'] = $hireDate;
        }
        if ($hasCategory) {
            $desired['job_category_id'] = $categoryId;
        }

        $categoryNames = JobCategory::whereIn('id', array_values(array_filter([
            $employee->job_category_id,
            $categoryId,
        ])))->pluck('name', 'id');
        $changes = [];
        foreach ($desired as $column => $newValue) {
            $oldValue = $column === 'hire_date'
                ? $employee->hire_date?->toDateString()
                : $employee->getAttribute($column);
            $normalizedNew = $column === 'hire_date' ? (string) $newValue : $newValue;
            if ((string) ($oldValue ?? '') === (string) ($normalizedNew ?? '')) {
                continue;
            }
            $displayColumn = $column === 'job_category_id' ? 'category' : $column;
            $displayOld = $column === 'job_category_id' ? ($categoryNames[$oldValue] ?? 'None') : $oldValue;
            $displayNew = $column === 'job_category_id' ? ($categoryNames[$newValue] ?? 'None') : $normalizedNew;
            $changes[] = ['column' => $displayColumn, 'old' => $displayOld, 'new' => $displayNew];
        }

        if ($changes === []) {
            return [
                'row' => $rowNumber,
                'name' => $employee->first_name . ' ' . $employee->last_name,
                'phone_number' => $employee->phone_number,
                'employee_code' => $employee->employee_code,
                'result' => 'UNCHANGED',
                'message' => 'Employee already exists and every supplied value is unchanged.',
                'changes' => [],
            ];
        }

        $employee->update($desired);
        $user = $employee->user;
        if ($user) {
            $userUpdates = [
                'phone_number' => $employee->phone_number,
                'is_active' => $employee->status !== 'terminated',
            ];
            if ($email !== '') {
                $userUpdates['email'] = $email;
            }
            $user->update($userUpdates);
        }

        return [
            'row' => $rowNumber,
            'name' => $employee->first_name . ' ' . $employee->last_name,
            'phone_number' => $employee->phone_number,
            'employee_code' => $employee->employee_code,
            'result' => 'UPDATED',
            'message' => 'Updated: ' . implode(', ', array_column($changes, 'column')) . '. Password was not changed.',
            'changes' => $changes,
        ];
    }

    private function templateBytes(): string
    {
        $book = new Spreadsheet();
        $sheet = $book->getActiveSheet();
        $sheet->setTitle('Employee Import');
        $headers = ['employee_code', 'first_name', 'last_name', 'email', 'phone_number', 'status', 'category', 'hire_date', 'date_calendar'];
        $sheet->fromArray($headers, null, 'A1');
        $sheet->fromArray(['', 'Abebe', 'Kebede', '', '0911234567', 'ACTIVE', 'Driver', '10/01/2018', 'EC'], null, 'A2');
        $sheet->getStyle('A1:I1')->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A1:I1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF07324A');
        $sheet->getStyle('A2:I2')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFFCF5E3');
        $sheet->freezePane('A2');
        $sheet->setAutoFilter('A1:I1');
        foreach (['A' => 20, 'B' => 22, 'C' => 28, 'D' => 34, 'E' => 20, 'F' => 18, 'G' => 22, 'H' => 18, 'I' => 18] as $column => $width) {
            $sheet->getColumnDimension($column)->setWidth($width);
        }

        $lists = $book->createSheet();
        $lists->setTitle('Lists');
        $categories = JobCategory::active()->orderBy('name')->pluck('name')->values()->all();
        $lists->fromArray([['Categories'], ...array_map(fn ($value) => [$value], $categories)], null, 'A1');
        $lists->fromArray([['Statuses'], ...array_map(fn ($value) => [strtoupper($value)], self::STATUSES)], null, 'B1');
        $lists->fromArray([['Calendars'], ['EC'], ['GC']], null, 'C1');
        $lists->setSheetState('hidden');
        if ($categories !== []) {
            $book->addNamedRange(new NamedRange('EmployeeCategories', $lists, '$A$2:$A$' . (count($categories) + 1)));
        }

        foreach (range(2, 1000) as $row) {
            $statusValidation = $sheet->getCell("F{$row}")->getDataValidation();
            $statusValidation->setType(DataValidation::TYPE_LIST)->setAllowBlank(true)->setShowErrorMessage(true)
                ->setErrorTitle('Invalid status')->setError('Choose ACTIVE, PROBATION, INACTIVE, or TERMINATED.')
                ->setFormula1('"ACTIVE,PROBATION,INACTIVE,TERMINATED"');
            if ($categories !== []) {
                $categoryValidation = $sheet->getCell("G{$row}")->getDataValidation();
                $categoryValidation->setType(DataValidation::TYPE_LIST)->setAllowBlank(true)->setShowErrorMessage(true)
                    ->setErrorTitle('Invalid category')->setError('Choose a category from the dropdown.')
                    ->setFormula1('=EmployeeCategories');
            }
            $calendarValidation = $sheet->getCell("I{$row}")->getDataValidation();
            $calendarValidation->setType(DataValidation::TYPE_LIST)->setAllowBlank(true)->setShowErrorMessage(true)
                ->setErrorTitle('Invalid calendar')->setError('Choose EC or GC.')
                ->setFormula1('"EC,GC"');
        }

        $guide = $book->createSheet();
        $guide->setTitle('Instructions');
        $guide->fromArray([
            ['ALEF DELTA EMPLOYEE IMPORT', ''],
            ['Required', 'first_name (or combined Name) and phone_number.'],
            ['Optional', 'employee_code, last_name, email, status, category, hire_date, date_calendar.'],
            ['Updates', 'Use employee_code for the safest update. If it is blank, a matching normalized phone identifies the existing employee. Only supplied changed fields are updated; passwords are never changed.'],
            ['Phone', '09XXXXXXXX is saved as +2519XXXXXXXX automatically.'],
            ['Dates', 'EC supports DD/MM/YYYY or DD/MM/YY. GC supports YYYY-MM-DD or DD/MM/YYYY. Missing hire dates use the import date.'],
            ['Category', 'Use the dropdown, exact category name, code, or numeric ID. The upload dialog default is used when blank.'],
            ['Existing rows', 'Existing identical rows are UNCHANGED. Existing rows with different supplied values are UPDATED and list old/new values.'],
            ['Legacy files', 'Name, Phone, and Hired Date headers are accepted. Combined Name is split at the first space.'],
            ['Errors', 'Rows are independent. Valid rows continue when another row has an error.'],
        ], null, 'A1');
        $guide->getStyle('A1:B1')->getFont()->setBold(true)->setSize(16)->getColor()->setARGB('FFFFFFFF');
        $guide->getStyle('A1:B1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF07324A');
        $guide->getColumnDimension('A')->setWidth(24);
        $guide->getColumnDimension('B')->setWidth(105);
        $guide->getStyle('A1:B20')->getAlignment()->setWrapText(true)->setVertical('top');

        $book->setActiveSheetIndex(0);
        $writer = new Xlsx($book);
        ob_start();
        $writer->save('php://output');
        return (string) ob_get_clean();
    }

    /**
     * @return array{map:array<string,int>,detected:array<int,string>,duplicates:array<int,string>}
     */
    private function analyzeHeaders(array $headers): array
    {
        $map = [];
        $detected = [];
        $duplicates = [];
        foreach ($headers as $index => $header) {
            $normalized = strtolower(trim((string) $header));
            $normalized = preg_replace('/^\xEF\xBB\xBF/', '', $normalized) ?? $normalized;
            $normalized = preg_replace('/[^a-z0-9]+/', '_', $normalized) ?? $normalized;
            $normalized = trim($normalized, '_');
            if (isset(self::HEADER_ALIASES[$normalized])) {
                $canonical = self::HEADER_ALIASES[$normalized];
                $detected[] = (string) $header;
                if (isset($map[$canonical])) {
                    $duplicates[] = $canonical;
                    continue;
                }
                $map[$canonical] = $index;
            }
        }
        return [
            'map' => $map,
            'detected' => $detected,
            'duplicates' => array_values(array_unique($duplicates)),
        ];
    }

    /** @return array{0:string,1:string,2:bool} */
    private function names(array $row): array
    {
        $firstName = trim((string) ($row['first_name'] ?? ''));
        $lastName = trim((string) ($row['last_name'] ?? ''));
        $hasLastName = $lastName !== '';
        if ($firstName === '') {
            $parts = preg_split('/\s+/u', trim((string) ($row['name'] ?? '')), -1, PREG_SPLIT_NO_EMPTY) ?: [];
            $firstName = (string) array_shift($parts);
            $lastName = implode(' ', $parts);
            $hasLastName = $lastName !== '';
        }
        if ($firstName === '') {
            throw EmployeeImportRowException::forColumn('first_name', $row['first_name'] ?? $row['name'] ?? null, 'First name is required.');
        }
        if (mb_strlen($firstName) > 255 || mb_strlen($lastName) > 255) {
            $column = mb_strlen($firstName) > 255 ? 'first_name' : 'last_name';
            throw EmployeeImportRowException::forColumn($column, $row[$column] ?? null, 'First name and last name must each be 255 characters or fewer.');
        }
        return [$firstName, $lastName !== '' ? $lastName : '-', $hasLastName];
    }

    private function categoryId($value, ?int $defaultCategoryId): ?int
    {
        if (!$this->filled($value)) {
            return $defaultCategoryId;
        }
        $category = is_numeric($value)
            ? JobCategory::find((int) $value)
            : JobCategory::whereRaw('LOWER(name) = ?', [strtolower(trim((string) $value))])
                ->orWhereRaw('LOWER(code) = ?', [strtolower(trim((string) $value))])
                ->first();
        if (!$category) {
            throw EmployeeImportRowException::forColumn('category', $value, "Employee category '{$value}' was not found. Use a category from Jobs → Manage Categories.");
        }
        return $category->id;
    }

    private function calendar($value, string $default): string
    {
        $calendar = strtoupper(trim((string) ($value ?: $default)));
        $calendar = match ($calendar) {
            'ETHIOPIAN', 'ETHIOPIAN CALENDAR' => 'EC',
            'GREGORIAN', 'GREGORIAN CALENDAR' => 'GC',
            default => $calendar,
        };
        if (!in_array($calendar, ['EC', 'GC'], true)) {
            throw EmployeeImportRowException::forColumn('date_calendar', $value, 'date_calendar must be EC or GC.');
        }
        return $calendar;
    }

    private function nextEmployeeCode(): string
    {
        $nextNumber = (Employee::lockForUpdate()->max('id') ?? 0) + 1;
        do {
            $code = 'EMP' . str_pad((string) $nextNumber, 5, '0', STR_PAD_LEFT);
            $nextNumber++;
        } while (Employee::where('employee_code', $code)->exists());
        return $code;
    }

    private function rowName(array $row): string
    {
        return trim((string) ($row['name'] ?? trim((string) ($row['first_name'] ?? '') . ' ' . (string) ($row['last_name'] ?? ''))));
    }

    private function filled($value): bool
    {
        return $value !== null && trim((string) $value) !== '';
    }

    private function authorizeImport(): void
    {
        abort_unless(auth()->user() && in_array(auth()->user()->role, self::ROLES, true), 403, 'Only management users can import employees.');
    }
}
