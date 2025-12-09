<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payslip - {{ $employee->first_name }} {{ $employee->last_name }}</title>
    <style>
        body { font-family: sans-serif; font-size: 14px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; }
        .details-table, .earnings-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .details-table td { padding: 5px; }
        .earnings-table th, .earnings-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        .earnings-table th { background-color: #f0f0f0; }
        .amount { text-align: right; }
        .total-row { font-weight: bold; background-color: #e0e0e0; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $company_name }}</h1>
        <h3>Payslip for {{ \Carbon\Carbon::parse($period->start_date)->format('F Y') }}</h3>
    </div>

    <table class="details-table">
        <tr>
            <td><strong>Employee:</strong> {{ $employee->first_name }} {{ $employee->last_name }}</td>
            <td><strong>Code:</strong> {{ $employee->employee_code }}</td>
        </tr>
        <tr>
            <td><strong>Department:</strong> {{ $employee->jobRole->name ?? 'N/A' }}</td>
            <td><strong>Worked Days:</strong> {{ $item->worked_days }}</td>
        </tr>
    </table>

    <table class="earnings-table">
        <thead>
            <tr>
                <th>Description</th>
                <th class="amount">Earnings</th>
                <th class="amount">Deductions</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Base Salary</td>
                <td class="amount">{{ number_format($item->base_salary, 2) }}</td>
                <td></td>
            </tr>
            <tr>
                <td>Shift Allowance</td>
                <td class="amount">{{ number_format($item->shift_allowance, 2) }}</td>
                <td></td>
            </tr>
            <tr>
                <td>Overtime ({{ $item->overtime_hours }} hrs)</td>
                <td class="amount">{{ number_format($item->overtime_pay, 2) }}</td>
                <td></td>
            </tr>
            <tr>
                <td>Income Tax</td>
                <td></td>
                <td class="amount">{{ number_format($item->income_tax, 2) }}</td>
            </tr>
            <tr>
                <td>Pension Contribution (7%)</td>
                <td></td>
                <td class="amount">{{ number_format($item->pension_contribution, 2) }}</td>
            </tr>
            <tr>
                <td>Penalties (Late: {{ $item->late_days }})</td>
                <td></td>
                <td class="amount">{{ number_format($item->penalties, 2) }}</td>
            </tr>
            <tr>
                <td>Asset Deductions</td>
                <td></td>
                <td class="amount">{{ number_format($item->asset_deductions, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td>TOTAL</td>
                <td class="amount">{{ number_format($item->total_gross, 2) }}</td>
                <td class="amount">{{ number_format($item->total_deductions, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div style="margin-top: 20px; border: 1px solid #000; padding: 10px; text-align: center;">
        <h3>NET PAY: {{ number_format($item->net_pay, 2) }} ETB</h3>
    </div>

    <div class="footer">
        <p>Generated on {{ now()->format('d M Y') }}</p>
        <p>This is a computer-generated document and needs no signature.</p>
    </div>
</body>
</html>
