<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{font-family:DejaVu Sans,sans-serif;font-size:9px;color:#222} h1{font-size:20px;margin:0} h2{font-size:13px;margin:18px 0 6px}.meta{color:#666;margin:5px 0 14px}.cards{width:100%;border-collapse:separate;border-spacing:5px}.cards td{border:1px solid #ccc;padding:8px}.cards strong{font-size:15px;display:block}table.data{width:100%;border-collapse:collapse}table.data th,table.data td{border:1px solid #ccc;padding:4px;text-align:left;vertical-align:top}table.data th{background:#e9eef7}.muted{color:#777}.page-break{page-break-before:always}</style></head>
<body>
<h1>{{ $title }}</h1>
<div class="meta">Asset creation date: {{ $startDate ?: 'Beginning' }} to {{ $endDate ?: 'Today' }} · Generated {{ now()->format('Y-m-d H:i') }}</div>
<table class="cards"><tr>
<td>Total<strong>{{ $report['summary']['total'] }}</strong></td><td>Available<strong>{{ $report['summary']['available'] }}</strong></td><td>Assigned<strong>{{ $report['summary']['assigned'] }}</strong></td><td>Total Value<strong>ETB {{ number_format($report['summary']['total_value'], 2) }}</strong></td><td>History Records<strong>{{ $report['summary']['history_records'] }}</strong></td>
</tr></table>
<h2>Asset Inventory</h2>
<table class="data"><thead><tr><th>Code</th><th>Asset</th><th>Company / Site</th><th>Category</th><th>Condition</th><th>Status</th><th>Value</th><th>Current Employee</th><th>Created</th></tr></thead><tbody>
@forelse($report['inventory'] as $row)<tr><td>{{ $row['asset_code'] }}</td><td>{{ $row['name'] }}</td><td>{{ $row['company'] }}<br><span class="muted">{{ $row['site'] }}</span></td><td>{{ $row['category'] }}</td><td>{{ $row['condition'] }}</td><td>{{ $row['status'] }}</td><td>{{ number_format($row['value'],2) }}</td><td>{{ $row['current_employee'] ?: '—' }}</td><td>{{ $row['created_at'] }}</td></tr>@empty<tr><td colspan="9">No assets in this date range.</td></tr>@endforelse
</tbody></table>
<div class="page-break"></div><h2>Assignment and Return Activity in Selected Date Range</h2>
<table class="data"><thead><tr><th>Code</th><th>Asset</th><th>Company</th><th>Employee</th><th>Assigned</th><th>Returned</th><th>Return Condition</th><th>Notes</th></tr></thead><tbody>
@forelse($report['history'] as $row)<tr><td>{{ $row['asset_code'] }}</td><td>{{ $row['asset_name'] }}</td><td>{{ $row['company'] }}</td><td>{{ $row['employee'] }}</td><td>{{ $row['assigned_at'] }}</td><td>{{ $row['returned_at'] ?: 'Currently assigned' }}</td><td>{{ $row['return_condition'] ?: '—' }}</td><td>{{ $row['notes'] ?: '—' }}</td></tr>@empty<tr><td colspan="8">No assignment history.</td></tr>@endforelse
</tbody></table></body></html>
