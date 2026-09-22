<?php

namespace App\Support;

use Carbon\Carbon;

class EthiopianCalendar
{
    private const EPOCH_JDN = 1724221;

    public static function toGregorian(int $year, int $month, int $day): Carbon
    {
        if ($year < 1 || $month < 1 || $month > 13) {
            throw new \InvalidArgumentException('Invalid Ethiopian year or month.');
        }

        $maximumDay = $month <= 12 ? 30 : ($year % 4 === 3 ? 6 : 5);
        if ($day < 1 || $day > $maximumDay) {
            throw new \InvalidArgumentException("Invalid Ethiopian day; month {$month} allows {$maximumDay} days.");
        }

        // Ethiopian leap day belongs to the end of years where year % 4 = 3.
        // floor(year / 4), rather than floor((year - 1) / 4), keeps dates
        // after that Pagume aligned (for example 1 Meskerem 2016 = 2023-09-12).
        $elapsed = 365 * ($year - 1) + intdiv($year, 4) + ($month - 1) * 30 + ($day - 1);
        [$gregorianYear, $gregorianMonth, $gregorianDay] = self::jdnToGregorian(self::EPOCH_JDN + $elapsed);

        return Carbon::create($gregorianYear, $gregorianMonth, $gregorianDay, 0, 0, 0, 'Africa/Addis_Ababa');
    }

    /** @return array{0:int,1:int,2:int} */
    private static function jdnToGregorian(int $jdn): array
    {
        $a = $jdn + 32044;
        $b = intdiv(4 * $a + 3, 146097);
        $c = $a - intdiv(146097 * $b, 4);
        $d = intdiv(4 * $c + 3, 1461);
        $e = $c - intdiv(1461 * $d, 4);
        $m = intdiv(5 * $e + 2, 153);
        $year = 100 * $b + $d - 4800 + intdiv($m, 10);
        $month = $m + 3 - 12 * intdiv($m, 10);
        $day = $e - intdiv(153 * $m + 2, 5) + 1;

        return [$year, $month, $day];
    }
}
