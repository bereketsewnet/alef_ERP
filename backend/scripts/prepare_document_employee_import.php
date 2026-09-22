<?php

use App\Models\Employee;
use App\Models\JobCategory;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$input = $argv[1] ?? null;
$output = $argv[2] ?? null;
if (!$input || !$output || !is_file($input)) {
    fwrite(STDERR, "Usage: php prepare_document_employee_import.php input.docx output.xlsx\n");
    exit(1);
}

$zip = new ZipArchive();
if ($zip->open($input) !== true) {
    throw new RuntimeException('Could not open the Word document.');
}
$documentXml = $zip->getFromName('word/document.xml');
$zip->close();
if ($documentXml === false) {
    throw new RuntimeException('The Word document does not contain word/document.xml.');
}

$document = new DOMDocument();
$document->loadXML($documentXml);
$xpath = new DOMXPath($document);
$xpath->registerNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');
$lines = [];
foreach ($xpath->query('//w:p') as $paragraph) {
    $text = '';
    foreach ($xpath->query('.//w:t', $paragraph) as $node) {
        $text .= $node->textContent;
    }
    $text = preg_replace('/\s+/u', ' ', trim($text)) ?? '';
    if ($text !== '') {
        $lines[] = $text;
    }
}

$security = JobCategory::whereRaw('LOWER(name) = ?', ['security'])->firstOrFail();
$cleaner = JobCategory::whereRaw('LOWER(name) = ?', ['cleaner'])->firstOrFail();
$categoryByRole = [
    'ጥበቃ' => $security,
    'ፅዳት' => $cleaner,
];

$records = [];
$excludedSupervisors = [];
for ($index = 0; $index < count($lines); $index++) {
    if (preg_match('/^\d+$/', $lines[$index]) !== 1) {
        continue;
    }
    $number = (int) $lines[$index];
    $name = $lines[$index + 1] ?? '';
    $role = $lines[$index + 2] ?? '';
    if ($name === '' || $role === '') {
        throw new RuntimeException("Document entry {$number} is incomplete.");
    }
    if (mb_strpos($role, 'ሱፐር') !== false) {
        $excludedSupervisors[] = $name;
        $index += 2;
        continue;
    }
    $category = $categoryByRole[$role] ?? null;
    if (!$category) {
        throw new RuntimeException("Document entry {$number} has unknown role '{$role}'.");
    }
    $parts = preg_split('/\s+/u', trim($name), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $firstName = (string) array_shift($parts);
    $lastName = $parts ? implode(' ', $parts) : '-';
    if ($firstName === '') {
        throw new RuntimeException("Document entry {$number} has no employee name.");
    }
    $records[] = [
        'source_number' => $number,
        'source_role' => $role,
        'first_name' => $firstName,
        'last_name' => $lastName,
        'category' => $category,
    ];
    $index += 2;
}

if (count($records) !== 29 || count($excludedSupervisors) !== 2) {
    throw new RuntimeException('Expected 29 non-supervisor employees and 2 supervisors, found ' . count($records) . ' and ' . count($excludedSupervisors) . '.');
}

$existingNames = [];
foreach ($records as $record) {
    $exists = Employee::where('first_name', $record['first_name'])
        ->where('last_name', $record['last_name'])
        ->exists();
    if ($exists) {
        $existingNames[] = trim($record['first_name'] . ' ' . $record['last_name']);
    }
}
if ($existingNames !== []) {
    throw new RuntimeException('These document names already exist in Employees and were not imported: ' . implode(', ', $existingNames));
}

$usedPhones = array_fill_keys(
    Employee::whereNotNull('phone_number')->pluck('phone_number')
        ->merge(User::whereNotNull('phone_number')->pluck('phone_number'))->all(),
    true
);
$usedEmails = array_fill_keys(
    Employee::whereNotNull('email')->pluck('email')
        ->merge(User::whereNotNull('email')->pluck('email'))->map(fn ($email) => mb_strtolower($email))->all(),
    true
);
$nextPhoneNumber = 9;
$today = now('Africa/Addis_Ababa')->toDateString();
$prepared = [];
$categoryCounts = [];
foreach ($records as $record) {
    do {
        $phone = '+2519' . str_pad((string) $nextPhoneNumber++, 8, '0', STR_PAD_LEFT);
    } while (isset($usedPhones[$phone]));
    $usedPhones[$phone] = true;

    $prefix = strtolower($record['category']->name) === 'security' ? 'diredawa.security' : 'diredawa.cleaner';
    $sequence = ($categoryCounts[$record['category']->id] ?? 0) + 1;
    do {
        $email = $prefix . '.import.' . str_pad((string) $sequence++, 3, '0', STR_PAD_LEFT) . '@alefdelta.com';
    } while (isset($usedEmails[$email]));
    $usedEmails[$email] = true;
    $categoryCounts[$record['category']->id] = ($categoryCounts[$record['category']->id] ?? 0) + 1;

    $prepared[] = [
        $record['first_name'],
        $record['last_name'],
        $email,
        $phone,
        'ACTIVE',
        $record['category']->name,
        $today,
        'GC',
        $record['source_number'],
        $record['source_role'],
    ];
}

$book = new Spreadsheet();
$sheet = $book->getActiveSheet();
$sheet->setTitle('Employee Import');
$headers = ['first_name', 'last_name', 'email', 'phone_number', 'status', 'category', 'hire_date', 'date_calendar', 'source_number', 'source_role'];
$sheet->fromArray($headers, null, 'A1');
foreach ($prepared as $index => $row) {
    $excelRow = $index + 2;
    $sheet->fromArray($row, null, "A{$excelRow}");
    $sheet->setCellValueExplicit("D{$excelRow}", $row[3], DataType::TYPE_STRING);
}
$lastRow = count($prepared) + 1;
$sheet->getStyle('A1:J1')->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
$sheet->getStyle('A1:J1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF07324A');
$sheet->freezePane('A2');
$sheet->setAutoFilter("A1:J{$lastRow}");
foreach (['A' => 22, 'B' => 32, 'C' => 38, 'D' => 20, 'E' => 14, 'F' => 18, 'G' => 16, 'H' => 16, 'I' => 15, 'J' => 18] as $column => $width) {
    $sheet->getColumnDimension($column)->setWidth($width);
}

$summary = $book->createSheet();
$summary->setTitle('Preparation Summary');
$summary->fromArray([
    ['DIRE DAWA EMPLOYEE IMPORT PREPARATION', ''],
    ['Document entries', 31],
    ['Supervisors excluded', count($excludedSupervisors)],
    ['Excluded supervisor names', implode(', ', $excludedSupervisors)],
    ['Employees prepared', count($prepared)],
    ['Security employees', $categoryCounts[$security->id] ?? 0],
    ['Cleaner employees', $categoryCounts[$cleaner->id] ?? 0],
    ['Generated phones', count($prepared)],
    ['Hire date used', $today . ' (Africa/Addis_Ababa)'],
    ['Stored/import calendar', 'Gregorian (GC)'],
    ['Source file', basename($input)],
], null, 'A1');
$summary->getStyle('A1:B1')->getFont()->setBold(true)->setSize(15)->getColor()->setARGB('FFFFFFFF');
$summary->getStyle('A1:B1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF07324A');
$summary->getColumnDimension('A')->setWidth(34);
$summary->getColumnDimension('B')->setWidth(85);

$book->setActiveSheetIndex(0);
(new Xlsx($book))->save($output);
echo json_encode([
    'document_entries' => 31,
    'prepared_employees' => count($prepared),
    'security' => $categoryCounts[$security->id] ?? 0,
    'cleaner' => $categoryCounts[$cleaner->id] ?? 0,
    'supervisors_excluded' => $excludedSupervisors,
    'hire_date' => $today,
    'first_generated_phone' => $prepared[0][3] ?? null,
    'last_generated_phone' => $prepared[array_key_last($prepared)][3] ?? null,
    'output' => $output,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PHP_EOL;
