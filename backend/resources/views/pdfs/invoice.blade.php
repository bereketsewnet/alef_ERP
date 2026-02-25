<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - {{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            margin: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 25px;
        }
        .company-block {
            text-align: left;
        }
        .company-name {
            font-size: 22px;
            font-weight: bold;
            color: #2c3e50;
        }
        .company-meta {
            font-size: 11px;
            color: #555;
        }
        .logo-block {
            text-align: right;
        }
        .logo-img {
            max-height: 60px;
        }
        .document-title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
            text-align: center;
            color: #34495e;
        }
        .info-section {
            margin-top: 15px;
            margin-bottom: 15px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }
        .info-label {
            font-weight: bold;
            width: 35%;
        }
        .info-value {
            width: 65%;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #34495e;
            color: #fff;
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .totals-row {
            background-color: #ecf0f1;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            font-size: 10px;
            color: #7f8c8d;
            text-align: center;
        }
        .stamp-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }
        .stamp-box {
            width: 180px;
            height: 120px;
            border: 1px dashed #888;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            color: #555;
        }
        .stamp-img {
            max-width: 180px;
            max-height: 120px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-block">
            <div class="company-name">{{ $company['name'] }}</div>
            <div class="company-meta">{{ $company['address'] }}</div>
            <div class="company-meta">Phone: {{ $company['phone'] }} | TIN: {{ $company['tin'] }}</div>
        </div>
        <div class="logo-block">
            @php
                $logoPath = public_path('assets/logo.png');
            @endphp
            @if (file_exists($logoPath))
                <img src="{{ $logoPath }}" class="logo-img" alt="Company Logo">
            @endif
        </div>
    </div>

    <div class="document-title">INVOICE</div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Invoice #:</span>
            <span class="info-value">{{ $invoice->invoice_number }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Invoice Date:</span>
            <span class="info-value">{{ \Carbon\Carbon::parse($invoice->invoice_date)->format('M d, Y') }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Due Date:</span>
            <span class="info-value">{{ \Carbon\Carbon::parse($invoice->due_date)->format('M d, Y') }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Client:</span>
            <span class="info-value">{{ $invoice->client->company_name ?? 'N/A' }}</span>
        </div>
        @if(!empty($invoice->client->contact_person))
        <div class="info-row">
            <span class="info-label">Contact Person:</span>
            <span class="info-value">{{ $invoice->client->contact_person }}</span>
        </div>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 50%;">Description</th>
                <th style="width: 10%;" class="text-right">Qty</th>
                <th style="width: 20%;" class="text-right">Unit Price (ETB)</th>
                <th style="width: 20%;" class="text-right">Total (ETB)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $item)
                <tr>
                    <td>{{ $item->description }}</td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">{{ number_format($item->unit_price, 2) }}</td>
                    <td class="text-right">{{ number_format($item->total, 2) }}</td>
                </tr>
            @endforeach
            <tr class="totals-row">
                <td colspan="3" class="text-right">TOTAL AMOUNT</td>
                <td class="text-right">{{ number_format($invoice->total_amount, 2) }} ETB</td>
            </tr>
        </tbody>
    </table>

    <div class="stamp-section">
        @php
            $stampPath = public_path('assets/stap.png');
        @endphp
        @if (file_exists($stampPath))
            <img src="{{ $stampPath }}" alt="Digital Stamp" class="stamp-img">
        @else
            <div class="stamp-box">
                DIGITAL STAMP
            </div>
        @endif
    </div>

    <div class="footer">
        <p>This is a computer-generated invoice with company letterhead and digital stamp.</p>
        <p>Generated on {{ now()->format('M d, Y H:i:s') }}</p>
    </div>
</body>
</html>

