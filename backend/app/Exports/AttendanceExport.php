<?php

namespace App\Exports;

use App\Models\AttendanceLog;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AttendanceExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $startDate;
    protected $endDate;
    protected $siteId;

    public function __construct($startDate = null, $endDate = null, $siteId = null)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->siteId = $siteId;
    }

    public function collection()
    {
        $query = AttendanceLog::with(['employee', 'schedule.site']);

        if ($this->startDate) {
            $query->where('clock_in_time', '>=', $this->startDate);
        }

        if ($this->endDate) {
            $query->where('clock_in_time', '<=', $this->endDate);
        }

        if ($this->siteId) {
            $query->whereHas('schedule', function ($q) {
                $q->where('site_id', $this->siteId);
            });
        }

        return $query->orderBy('clock_in_time', 'desc')->get();
    }

    public function headings(): array
    {
        return [
            'Employee Code',
            'Employee Name',
            'Site',
            'Clock In',
            'Clock Out',
            'Hours Worked',
            'Verified',
            'Late',
            'Verification Method',
        ];
    }

    public function map($attendance): array
    {
        $clockIn = $attendance->clock_in_time ? \Carbon\Carbon::parse($attendance->clock_in_time) : null;
        $clockOut = $attendance->clock_out_time ? \Carbon\Carbon::parse($attendance->clock_out_time) : null;
        $hoursWorked = ($clockIn && $clockOut) ? $clockOut->diffInHours($clockIn, true) : 0;

        return [
            $attendance->employee->employee_code,
            $attendance->employee->first_name . ' ' . $attendance->employee->last_name,
            $attendance->schedule->site->site_name ?? 'N/A',
            $clockIn ? $clockIn->format('Y-m-d H:i:s') : 'N/A',
            $clockOut ? $clockOut->format('Y-m-d H:i:s') : 'N/A',
            number_format($hoursWorked, 2),
            $attendance->is_verified ? 'Yes' : 'No',
            $attendance->flagged_late ? 'Yes' : 'No',
            $attendance->verification_method ?? 'N/A',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '34495e']], 'font' => ['color' => ['rgb' => 'FFFFFF']]],
        ];
    }
}
