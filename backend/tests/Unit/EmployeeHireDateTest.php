<?php

namespace Tests\Unit;

use App\Support\EmployeeHireDate;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class EmployeeHireDateTest extends TestCase
{
    #[DataProvider('dates')]
    public function test_it_parses_ec_and_gc_dates(string $value, string $calendar, string $expected): void
    {
        $this->assertSame($expected, EmployeeHireDate::parse($value, $calendar));
    }

    public static function dates(): array
    {
        return [
            'Ethiopian full year' => ['01/01/2016', 'EC', '2023-09-12'],
            'Ethiopian short year' => ['10/01/16', 'EC', '2023-09-21'],
            'Ethiopian Pagume' => ['04/13/18', 'EC', '2026-09-09'],
            'Gregorian ISO' => ['2026-09-21', 'GC', '2026-09-21'],
            'Gregorian day first' => ['21/09/2026', 'GC', '2026-09-21'],
        ];
    }
}
