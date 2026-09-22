<?php

namespace App\Support;

use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class EmployeeHireDate
{
    public static function parse($value, string $calendar): string
    {
        $calendar = strtoupper($calendar);
        if (!in_array($calendar, ['EC', 'GC'], true)) {
            throw new \InvalidArgumentException('Calendar must be EC or GC.');
        }
        if ($value === null || trim((string) $value) === '' || trim((string) $value) === '-') {
            return now('Africa/Addis_Ababa')->toDateString();
        }
        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)->toDateString();
        }
        if (is_numeric($value)) {
            return Carbon::instance(ExcelDate::excelToDateTimeObject($value))->toDateString();
        }

        $text = trim((string) $value);
        $parts = null;
        if (preg_match('/^(\d{1,4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,4})$/', $text, $matches) === 1) {
            if (strlen($matches[1]) === 4) {
                $parts = [(int) $matches[1], (int) $matches[2], (int) $matches[3]];
            } else {
                $year = (int) $matches[3];
                $year = $year < 100 ? 2000 + $year : $year;
                $parts = [$year, (int) $matches[2], (int) $matches[1]];
            }
        }
        if (!$parts) {
            throw new \InvalidArgumentException("Hire date '{$text}' is invalid. Use DD/MM/YYYY for EC or YYYY-MM-DD for GC.");
        }

        try {
            if ($calendar === 'EC') {
                return EthiopianCalendar::toGregorian($parts[0], $parts[1], $parts[2])->toDateString();
            }
            if (!checkdate($parts[1], $parts[2], $parts[0])) {
                throw new \InvalidArgumentException('Invalid Gregorian date.');
            }
            return Carbon::create($parts[0], $parts[1], $parts[2], 0, 0, 0, 'Africa/Addis_Ababa')->toDateString();
        } catch (\Throwable $exception) {
            throw new \InvalidArgumentException("Hire date '{$text}' is invalid for {$calendar}: {$exception->getMessage()}");
        }
    }
}
