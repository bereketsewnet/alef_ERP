<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\Employee;
use App\Models\ShiftSchedule;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Barryvdh\DomPDF\Facade\Pdf;
use ZipArchive;

class AttendanceImportController extends Controller
{
    private const ROLES = ['OWNER', 'GM', 'HR', 'OPERATIONS'];
    private const STATUSES = ['PRESENT', 'LATE', 'LATE_WITH_PERMISSION', 'ABSENT', 'ABSENT_WITH_PERMISSION', 'POLICY_VIOLATION'];
    private const TYPES = ['MANUAL', 'GPS', 'MIXED'];
    private const TZ = 'Africa/Addis_Ababa';

    private function authorizeImport(): void
    {
        abort_unless(auth()->user() && in_array(auth()->user()->role, self::ROLES, true), 403, 'Only management users can import attendance.');
    }

    public function template()
    {
        $this->authorizeImport();
        $book = new Spreadsheet();
        $sheet = $book->getActiveSheet();
        $sheet->setTitle('Attendance Import');
        $headers = [
            'employee_code', 'attendance_date', 'status', 'attendance_type', 'clock_in_time', 'clock_out_time',
            'site_id', 'schedule_id', 'clock_in_latitude', 'clock_in_longitude', 'clock_in_accuracy_m',
            'clock_out_latitude', 'clock_out_longitude', 'clock_out_accuracy_m', 'note',
        ];
        $sheet->fromArray($headers, null, 'A1');
        $sheet->fromArray(['EMP001', now(self::TZ)->toDateString(), 'PRESENT', 'MANUAL', '08:00', '17:00', '', '', '', '', '', '', '', '', 'Example row — replace or delete'], null, 'A2');
        $sheet->getStyle('A1:O1')->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A1:O1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF123B73');
        $sheet->freezePane('A2');
        $sheet->setAutoFilter('A1:O1');
        foreach (range('A', 'O') as $column) $sheet->getColumnDimension($column)->setAutoSize(true);

        foreach (range(2, 1000) as $row) {
            $status = $sheet->getCell("C{$row}")->getDataValidation();
            $status->setType(DataValidation::TYPE_LIST)->setErrorStyle(DataValidation::STYLE_STOP)
                ->setAllowBlank(false)->setShowErrorMessage(true)->setShowDropDown(true)
                ->setErrorTitle('Invalid status')->setError('Select a value from the dropdown.')
                ->setFormula1('"' . implode(',', self::STATUSES) . '"');
            $type = $sheet->getCell("D{$row}")->getDataValidation();
            $type->setType(DataValidation::TYPE_LIST)->setErrorStyle(DataValidation::STYLE_STOP)
                ->setAllowBlank(false)->setShowErrorMessage(true)->setShowDropDown(true)
                ->setErrorTitle('Invalid type')->setError('Select MANUAL, GPS, or MIXED.')
                ->setFormula1('"' . implode(',', self::TYPES) . '"');
        }

        $guide = $book->createSheet();
        $guide->setTitle('Instructions');
        $guide->fromArray([
            ['ATTENDANCE IMPORT GUIDE', ''],
            ['Rule', 'Explanation'],
            ['One row', 'One employee attendance record for one scheduled shift.'],
            ['employee_code (required)', 'Use the exact employee ID/code shown in Employees, e.g. EMP001 or FS-000013.'],
            ['attendance_date (required)', 'YYYY-MM-DD. Excel date cells are also accepted.'],
            ['status (required)', implode(', ', self::STATUSES)],
            ['attendance_type (required)', 'MANUAL: GPS fields ignored; GPS: clock-in coordinates required; MIXED: manual record with optional GPS evidence.'],
            ['clock times (optional)', 'Use HH:MM, HH:MM:SS, YYYY-MM-DD HH:MM, or an Excel time. Defaults to scheduled times for present/late rows.'],
            ['site_id / schedule_id (optional)', 'Use schedule_id for exact matching. If omitted, employee + date must match exactly one shift. Use site_id when multiple shifts exist.'],
            ['GPS fields', 'Latitude -90..90, longitude -180..180, accuracy in meters. GPS rows are verified against the site radius.'],
            ['note', 'Required for POLICY_VIOLATION; optional otherwise. Maximum 500 characters.'],
            ['Existing records', 'Identical data is reported as UNCHANGED. Different imported values update the existing record and are reported as UPDATED.'],
            ['Error handling', 'Every row is processed independently. A bad row does not stop valid rows. Review the row-by-row result after upload.'],
            ['Security', 'Only management users can import. Imported changes retain the importing user as verifier.'],
        ], null, 'A1');
        $guide->getStyle('A1:B1')->getFont()->setBold(true)->setSize(16)->getColor()->setARGB('FFFFFFFF');
        $guide->getStyle('A1:B1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF123B73');
        $guide->getStyle('A2:B2')->getFont()->setBold(true);
        $guide->getColumnDimension('A')->setWidth(32);
        $guide->getColumnDimension('B')->setWidth(105);
        $guide->getStyle('A1:B20')->getAlignment()->setWrapText(true)->setVertical('top');

        $book->setActiveSheetIndex(0);
        $writer = new Xlsx($book);
        return response()->streamDownload(fn () => $writer->save('php://output'), 'attendance_import_template.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function import(Request $request)
    {
        $this->authorizeImport();
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv|max:10240']);
        $book = IOFactory::load($request->file('file')->getRealPath());
        $sheet = $book->getSheetByName('Attendance Import') ?: $book->getActiveSheet();
        $lastDataRow = max(1, $sheet->getHighestDataRow());
        $rows = $sheet->rangeToArray("A1:O{$lastDataRow}", null, true, true, true);
        if (!$rows) return response()->json(['message' => 'The spreadsheet is empty.'], 422);
        $headers = array_map(fn ($value) => strtolower(trim((string) $value)), array_values(array_shift($rows)));
        $required = ['employee_code', 'attendance_date', 'status', 'attendance_type'];
        $missing = array_values(array_diff($required, $headers));
        if ($missing) return response()->json(['message' => 'Missing required column(s): ' . implode(', ', $missing)], 422);
        $map = array_flip($headers);
        $results = [];
        $counts = ['created' => 0, 'updated' => 0, 'unchanged' => 0, 'errors' => 0, 'empty' => 0];

        foreach ($rows as $offset => $raw) {
            $rowNumber = $offset + 2;
            $values = array_values($raw);
            if (!array_filter($values, fn ($v) => $v !== null && trim((string) $v) !== '')) { $counts['empty']++; continue; }
            $row = [];
            foreach ($map as $name => $index) $row[$name] = $values[$index] ?? null;
            try {
                $result = DB::transaction(fn () => $this->processRow($row, $rowNumber));
                $counts[strtolower($result['result'])]++;
                $results[] = $result;
            } catch (\Throwable $e) {
                $counts['errors']++;
                $results[] = ['row' => $rowNumber, 'employee_code' => trim((string) ($row['employee_code'] ?? '')), 'result' => 'ERROR', 'message' => $e->getMessage()];
            }
        }
        return response()->json(['message' => "Import finished: {$counts['created']} created, {$counts['updated']} updated, {$counts['unchanged']} unchanged, {$counts['errors']} errors.", 'summary' => $counts, 'rows' => $results]);
    }

    public function bundle()
    {
        $this->authorizeImport();
        $templateResponse = $this->template();
        ob_start();
        ($templateResponse->getCallback())();
        $excel = ob_get_clean();

        $englishPdf = Pdf::loadView('attendance.import_guide_en')->setPaper('a4')->output();
        $amharicPdf = Pdf::loadView('attendance.import_guide_am')->setPaper('a4')->output();
        $zipPath = tempnam(sys_get_temp_dir(), 'attendance_docs_');
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Could not create the documentation ZIP file.');
        }
        $zip->addFromString('attendance_import_template.xlsx', $excel);
        $zip->addFromString('attendance_import_guide_english.pdf', $englishPdf);
        $zip->addFromString('attendance_import_guide_amharic.pdf', $amharicPdf);
        $zip->close();

        return response()->download($zipPath, 'attendance_import_complete_package.zip', [
            'Content-Type' => 'application/zip',
        ])->deleteFileAfterSend(true);
    }

    private function processRow(array $row, int $rowNumber): array
    {
        $code = trim((string) ($row['employee_code'] ?? ''));
        if ($code === '') throw new \RuntimeException('employee_code is required.');
        $employee = Employee::whereRaw('UPPER(employee_code) = ?', [strtoupper($code)])->first();
        if (!$employee) throw new \RuntimeException("Employee ID '{$code}' was not found.");
        $date = $this->dateValue($row['attendance_date'] ?? null, 'attendance_date')->toDateString();
        $status = strtoupper(trim((string) ($row['status'] ?? '')));
        if (!in_array($status, self::STATUSES, true)) throw new \RuntimeException('Invalid status. Use: ' . implode(', ', self::STATUSES) . '.');
        $type = strtoupper(trim((string) ($row['attendance_type'] ?? '')));
        if (!in_array($type, self::TYPES, true)) throw new \RuntimeException('Invalid attendance_type. Use MANUAL, GPS, or MIXED.');
        $note = trim((string) ($row['note'] ?? ''));
        if ($status === 'POLICY_VIOLATION' && $note === '') throw new \RuntimeException('note is required for POLICY_VIOLATION.');
        if (mb_strlen($note) > 500) throw new \RuntimeException('note cannot exceed 500 characters.');

        $query = ShiftSchedule::with('site')->where('employee_id', $employee->id)->whereDate('shift_start', $date);
        if ($this->filled($row['schedule_id'] ?? null)) $query->whereKey((int) $row['schedule_id']);
        if ($this->filled($row['site_id'] ?? null)) $query->where('site_id', (int) $row['site_id']);
        $matches = $query->get();
        if ($matches->isEmpty()) throw new \RuntimeException("No scheduled shift found for {$code} on {$date}" . ($this->filled($row['site_id'] ?? null) ? ' at site ' . $row['site_id'] : '') . '.');
        if ($matches->count() > 1) throw new \RuntimeException("Multiple shifts found for {$code} on {$date}; provide schedule_id or site_id.");
        $schedule = $matches->first();

        $absent = in_array($status, ['ABSENT', 'ABSENT_WITH_PERMISSION'], true);
        $late = in_array($status, ['LATE', 'LATE_WITH_PERMISSION'], true);
        $permission = in_array($status, ['LATE_WITH_PERMISSION', 'ABSENT_WITH_PERMISSION'], true);
        $storedStatus = $status === 'POLICY_VIOLATION' ? $status : ($absent ? 'ABSENT' : ($late ? 'LATE' : 'PRESENT'));
        $clockIn = $absent ? Carbon::parse($schedule->shift_start) : $this->timeValue($row['clock_in_time'] ?? null, $date, Carbon::parse($schedule->shift_start));
        $clockOut = $absent ? null : $this->timeValue($row['clock_out_time'] ?? null, $date, Carbon::parse($schedule->shift_end));
        if ($clockOut && $clockIn && $clockOut->lt($clockIn)) throw new \RuntimeException('clock_out_time cannot be before clock_in_time.');

        $lat = $this->number($row['clock_in_latitude'] ?? null, -90, 90, 'clock_in_latitude');
        $lng = $this->number($row['clock_in_longitude'] ?? null, -180, 180, 'clock_in_longitude');
        if ($type === 'GPS' && !$absent && ($lat === null || $lng === null)) throw new \RuntimeException('GPS rows require clock_in_latitude and clock_in_longitude.');
        $outLat = $this->number($row['clock_out_latitude'] ?? null, -90, 90, 'clock_out_latitude');
        $outLng = $this->number($row['clock_out_longitude'] ?? null, -180, 180, 'clock_out_longitude');
        $distance = ($lat !== null && $lng !== null && $schedule->site) ? $this->distance($lat, $lng, (float) $schedule->site->latitude, (float) $schedule->site->longitude) : null;
        $outDistance = ($outLat !== null && $outLng !== null && $schedule->site) ? $this->distance($outLat, $outLng, (float) $schedule->site->latitude, (float) $schedule->site->longitude) : null;
        $verified = !$absent && ($type === 'MANUAL' || ($distance !== null && $distance <= (float) ($schedule->site->geo_radius_meters ?? 100)));

        $data = [
            'employee_id' => $employee->id, 'clock_in_time' => $clockIn, 'clock_out_time' => $clockOut,
            'clock_in_lat' => $type === 'MANUAL' ? null : $lat, 'clock_in_long' => $type === 'MANUAL' ? null : $lng,
            'clock_in_accuracy' => $this->number($row['clock_in_accuracy_m'] ?? null, 0, null, 'clock_in_accuracy_m'),
            'clock_in_distance' => $type === 'MANUAL' ? null : $distance,
            'clock_out_lat' => $type === 'MANUAL' ? null : $outLat, 'clock_out_long' => $type === 'MANUAL' ? null : $outLng,
            'clock_out_accuracy' => $this->number($row['clock_out_accuracy_m'] ?? null, 0, null, 'clock_out_accuracy_m'),
            'clock_out_distance' => $type === 'MANUAL' ? null : $outDistance,
            'clock_out_verified' => $outDistance !== null && $outDistance <= (float) ($schedule->site->geo_radius_meters ?? 100),
            'is_verified' => $verified, 'verification_method' => $type, 'flagged_late' => $late,
            'with_permission' => $permission, 'attendance_status' => $storedStatus,
            'manual_entry' => $type !== 'GPS', 'manual_note' => $note ?: null, 'verified_by_user_id' => auth()->id(),
        ];
        $existing = AttendanceLog::where('schedule_id', $schedule->id)->first();
        if ($existing) {
            $comparable = $data; unset($comparable['verified_by_user_id']);
            $changed = collect($comparable)->contains(fn ($value, $key) => $this->normalized($existing->{$key}) !== $this->normalized($value));
            if (!$changed) return ['row' => $rowNumber, 'employee_code' => $code, 'result' => 'UNCHANGED', 'message' => 'Attendance already exists with the same data.'];
            $existing->update($data);
            $result = 'UPDATED'; $message = 'Existing attendance was updated with changed spreadsheet values.';
        } else {
            AttendanceLog::create(['schedule_id' => $schedule->id] + $data);
            $result = 'CREATED'; $message = 'Attendance created successfully.';
        }
        $schedule->update(['status' => $absent ? 'NO_SHOW' : ($clockOut ? 'COMPLETED' : 'IN_PROGRESS')]);
        return ['row' => $rowNumber, 'employee_code' => $code, 'result' => $result, 'message' => $message];
    }

    private function filled($value): bool { return $value !== null && trim((string) $value) !== ''; }
    private function dateValue($value, string $field): Carbon
    {
        if (!$this->filled($value)) throw new \RuntimeException("{$field} is required.");
        try { return is_numeric($value) ? Carbon::instance(ExcelDate::excelToDateTimeObject($value))->timezone(self::TZ) : Carbon::parse($value, self::TZ); }
        catch (\Throwable) { throw new \RuntimeException("{$field} is not a valid date; use YYYY-MM-DD."); }
    }
    private function timeValue($value, string $date, Carbon $default): Carbon
    {
        if (!$this->filled($value)) return $default;
        try {
            if (is_numeric($value)) { $time = Carbon::instance(ExcelDate::excelToDateTimeObject($value)); return Carbon::parse($date . ' ' . $time->format('H:i:s'), self::TZ); }
            $text = trim((string) $value);
            return preg_match('/^\d{1,2}:\d{2}(:\d{2})?$/', $text) ? Carbon::parse("{$date} {$text}", self::TZ) : Carbon::parse($text, self::TZ);
        } catch (\Throwable) { throw new \RuntimeException("Invalid time '{$value}'. Use HH:MM or YYYY-MM-DD HH:MM."); }
    }
    private function number($value, ?float $min, ?float $max, string $field): ?float
    {
        if (!$this->filled($value)) return null;
        if (!is_numeric($value)) throw new \RuntimeException("{$field} must be numeric.");
        $number = (float) $value;
        if ($min !== null && $number < $min || $max !== null && $number > $max) throw new \RuntimeException("{$field} is outside the allowed range.");
        return $number;
    }
    private function distance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earth = 6371000; $dLat = deg2rad($lat2 - $lat1); $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return round($earth * 2 * atan2(sqrt($a), sqrt(1 - $a)), 2);
    }
    private function normalized($value): string
    {
        if ($value instanceof \DateTimeInterface) return Carbon::instance($value)->format('Y-m-d H:i:s');
        if (is_bool($value)) return $value ? '1' : '0';
        if ($value === null) return '';
        return is_numeric($value) ? rtrim(rtrim(number_format((float) $value, 6, '.', ''), '0'), '.') : (string) $value;
    }
}
