<?php

use App\Models\Employee;
use App\Models\User;
use App\Support\EmployeeHireDate;
use App\Support\EthiopianPhoneNumber;
use Illuminate\Contracts\Console\Kernel;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$input = $argv[1] ?? null;
$output = $argv[2] ?? null;
if (!$input || !$output || !is_file($input)) {
    fwrite(STDERR, "Usage: php prepare_driver_import.php input.xlsx output.xlsx\n");
    exit(1);
}

$source = IOFactory::load($input)->getActiveSheet();
$rows = $source->rangeToArray('A2:C' . $source->getHighestDataRow(), null, true, true, false);
$usedPhones = array_fill_keys(
    Employee::whereNotNull('phone_number')->pluck('phone_number')
        ->merge(User::whereNotNull('phone_number')->pluck('phone_number'))->all(),
    true
);
$nextGenerated = 9;
$generated = 0;
$duplicatesRemoved = 0;
$missingDates = 0;
$correctedDates = 0;
$invalidDatesDefaulted = 0;
$seenSourceRecords = [];
$prepared = [];

foreach ($rows as $offset => $row) {
    $sourceRow = $offset + 2;
    $fullName = preg_replace('/\s+/u', ' ', trim((string) ($row[0] ?? ''))) ?? '';
    $sourcePhone = trim((string) ($row[1] ?? ''));
    $sourceDate = trim((string) ($row[2] ?? ''));
    if ($fullName === '') {
        throw new RuntimeException("Source row {$sourceRow} has no employee name.");
    }

    $sourceKey = mb_strtolower($fullName) . '|' . $sourcePhone;
    if (isset($seenSourceRecords[$sourceKey])) {
        $duplicatesRemoved++;
        continue;
    }
    $seenSourceRecords[$sourceKey] = true;

    $nameParts = preg_split('/\s+/u', $fullName, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $firstName = (string) array_shift($nameParts);
    $lastName = $nameParts ? implode(' ', $nameParts) : '-';
    $phone = EthiopianPhoneNumber::normalize($sourcePhone);
    if (!is_string($phone) || preg_match('/^\+2519\d{8}$/', $phone) !== 1 || isset($usedPhones[$phone])) {
        do {
            $phone = '+2519' . str_pad((string) $nextGenerated++, 8, '0', STR_PAD_LEFT);
        } while (isset($usedPhones[$phone]));
        $generated++;
    }
    $usedPhones[$phone] = true;

    if ($sourceDate === '' || $sourceDate === '-') {
        $missingDates++;
    }
    if (preg_match('/^(\d{1,2})\/(\d{2})(\d{2})$/', $sourceDate, $dateParts) === 1) {
        $sourceDate = "{$dateParts[1]}/{$dateParts[2]}/{$dateParts[3]}";
        $correctedDates++;
    }
    try {
        $hireDate = EmployeeHireDate::parse($sourceDate, 'EC');
    } catch (Throwable) {
        $hireDate = EmployeeHireDate::parse(null, 'EC');
        $invalidDatesDefaulted++;
    }
    $sequence = count($prepared) + 1;
    $prepared[] = [
        $firstName,
        $lastName,
        'driver.import.' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT) . '@alefdelta.com',
        $phone,
        'ACTIVE',
        'Driver',
        $hireDate,
        'GC',
        $sourceRow,
    ];
}

$book = new Spreadsheet();
$sheet = $book->getActiveSheet();
$sheet->setTitle('Employee Import');
$headers = ['first_name', 'last_name', 'email', 'phone_number', 'status', 'category', 'hire_date', 'date_calendar', 'source_row'];
$sheet->fromArray($headers, null, 'A1');
foreach ($prepared as $index => $row) {
    $excelRow = $index + 2;
    $sheet->fromArray($row, null, "A{$excelRow}");
    $sheet->setCellValueExplicit("D{$excelRow}", $row[3], DataType::TYPE_STRING);
}
$lastRow = count($prepared) + 1;
$sheet->getStyle('A1:I1')->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
$sheet->getStyle('A1:I1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF07324A');
$sheet->getStyle("A2:I{$lastRow}")->getBorders()->getHorizontal()->setBorderStyle('hair');
$sheet->freezePane('A2');
$sheet->setAutoFilter("A1:I{$lastRow}");
foreach (['A' => 22, 'B' => 32, 'C' => 35, 'D' => 20, 'E' => 14, 'F' => 18, 'G' => 16, 'H' => 16, 'I' => 12] as $column => $width) {
    $sheet->getColumnDimension($column)->setWidth($width);
}

$summary = $book->createSheet();
$summary->setTitle('Preparation Summary');
$summary->fromArray([
    ['ALEF DELTA DRIVER IMPORT PREPARATION', ''],
    ['Original spreadsheet rows', count($rows)],
    ['Exact duplicate rows removed', $duplicatesRemoved],
    ['Distinct drivers prepared', count($prepared)],
    ['Generated/replaced phone numbers', $generated],
    ['Missing hire dates set to preparation date', $missingDates],
    ['Malformed dates repaired', $correctedDates],
    ['Unreadable dates set to preparation date', $invalidDatesDefaulted],
    ['Source calendar', 'Ethiopian (EC)'],
    ['Stored/import calendar', 'Gregorian (GC)'],
    ['Category', 'Driver'],
    ['Status', 'ACTIVE'],
], null, 'A1');
$summary->getStyle('A1:B1')->getFont()->setBold(true)->setSize(15)->getColor()->setARGB('FFFFFFFF');
$summary->getStyle('A1:B1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF07324A');
$summary->getColumnDimension('A')->setWidth(42);
$summary->getColumnDimension('B')->setWidth(32);

$book->setActiveSheetIndex(0);
(new Xlsx($book))->save($output);
echo json_encode([
    'source_rows' => count($rows),
    'duplicates_removed' => $duplicatesRemoved,
    'prepared_rows' => count($prepared),
    'generated_phones' => $generated,
    'missing_dates_defaulted' => $missingDates,
    'malformed_dates_repaired' => $correctedDates,
    'invalid_dates_defaulted' => $invalidDatesDefaulted,
    'output' => $output,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), PHP_EOL;
