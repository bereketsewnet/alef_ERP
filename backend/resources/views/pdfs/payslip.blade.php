<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payslip - {{ $employee->employee_code }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            margin: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
        }
        .document-title {
            font-size: 18px;
            margin-top: 10px;
            color: #34495e;
        }
        .info-section {
            margin-bottom: 20px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .info-label {
            font-weight: bold;
            width: 40%;
        }
        .info-value {
            width: 60%;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #34495e;
            color: white;
            font-weight: bold;
        }
        .section-header {
            background-color: #ecf0f1;
            font-weight: bold;
            padding: 8px;
            margin-top: 15px;
        }
        .total-row {
            background-color: #2ecc71;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #7f8c8d;
        }
        .text-right {
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $company['name'] }}</div>
        <div>{{ $company['address'] }}</div>
        <div>Phone: {{ $company['phone'] }} | TIN: {{ $company['tin'] }}</div>
        <div class="document-title">PAYSLIP</div>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Employee Code:</span>
            <span class="info-value">{{ $employee->employee_code }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Employee Name:</span>
            <span class="info-value">{{ $employee->first_name }} {{ $employee->last_name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Job Role:</span>
            <span class="info-value">{{ $employee->jobRole->title }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Pay Period:</span>
            <span class="info-value">{{ $period->start_date->format('M d, Y') }} - {{ $period->end_date->format('M d, Y') }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Payment Date:</span>
            <span class="info-value">{{ $payslip->created_at->format('M d, Y') }}</span>
        </div>
    </div>

    <div class="section-header">EARNINGS</div>
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th class="text-right">Amount (ETB)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Basic Salary ({{ number_format($payslip->total_hours_worked, 2) }} hours)</td>
                <td class="text-right">{{ number_format($payslip->basic_salary, 2) }}</td>
            </tr>
            <tr>
                <td>Overtime ({{ number_format($payslip->overtime_hours, 2) }} hours @ 1.5x)</td>
                <td class="text-right">{{ number_format($payslip->overtime_amount, 2) }}</td>
            </tr>
            <tr>
                <td>Transport Allowance</td>
                <td class="text-right">{{ number_format($payslip->transport_allowance, 2) }}</td>
            </tr>
            <tr style="background-color: #ecf0f1; font-weight: bold;">
                <td>Gross Income</td>
                <td class="text-right">{{ number_format($payslip->basic_salary + $payslip->overtime_amount + $payslip->transport_allowance, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="section-header">DEDUCTIONS</div>
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th class="text-right">Amount (ETB)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Income Tax</td>
                <td class="text-right">{{ number_format($payslip->income_tax, 2) }}</td>
            </tr>
            <tr>
                <td>Pension (7%)</td>
                <td class="text-right">{{ number_format($payslip->pension_7_percent, 2) }}</td>
            </tr>
            <tr>
                <td>Cost Sharing (Health Insurance)</td>
                <td class="text-right">{{ number_format($payslip->cost_sharing, 2) }}</td>
            </tr>
            @if($payslip->penalty_deductions > 0)
            <tr>
                <td>Penalty Deductions</td>
                <td class="text-right">{{ number_format($payslip->penalty_deductions, 2) }}</td>
            </tr>
            @endif
            @if($payslip->loan_repayment > 0)
            <tr>
                <td>Loan Repayment</td>
                <td class="text-right">{{ number_format($payslip->loan_repayment, 2) }}</td>
            </tr>
            @endif
            <tr style="background-color: #ecf0f1; font-weight: bold;">
                <td>Total Deductions</td>
                <td class="text-right">{{ number_format($payslip->income_tax + $payslip->pension_7_percent + $payslip->cost_sharing + $payslip->penalty_deductions + $payslip->loan_repayment, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <table style="margin-top: 20px;">
        <tr class="total-row">
            <td style="font-size: 16px;">NET PAY</td>
            <td class="text-right" style="font-size: 16px;">{{ number_format($payslip->net_pay, 2) }} ETB</td>
        </tr>
    </table>

    <div class="footer">
        <p>This is a computer-generated document. No signature is required.</p>
        <p>Generated on {{ now()->format('M d, Y H:i:s') }}</p>
    </div>
</body>
</html>
