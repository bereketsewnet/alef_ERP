# API Documentation

## Swagger/OpenAPI Documentation

The API documentation is available via Swagger UI after running the swagger generation command.

### Generate Swagger Documentation

```bash
php artisan l5-swagger:generate
```

### Access Swagger UI

After generation, access the interactive API documentation at:

```
http://localhost:8000/api/documentation
```

### Manual API Reference

#### Base URL
```
http://localhost:8000/api
```

---

## Authentication Endpoints

### 1. Login (Username/Password)

```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@alefdelta.com",
    "role": "SUPER_ADMIN"
  }
}
```

### 2. Telegram Login

```http
POST /auth/telegram
```

**Request Body:**
```json
{
  "initData": "query_id=AAHdF6IQA..."
}
```

---

## Attendance Endpoints

### Clock In

```http
POST /attendance/clock-in
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "schedule_id": 1,
  "latitude": 9.0054,
  "longitude": 38.7636,
  "initData": "optional_telegram_data"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Clocked in successfully",
  "attendance": {
    "id": 1,
    "clock_in_time": "2025-12-02T03:00:00Z",
    "is_verified": true,
    "flagged_late": false
  },
  "distance": 45.2
}
```

---

## Roster Endpoints

### Bulk Assign Shifts

```http
POST /roster/bulk-assign
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "assignments": [
    {
      "employee_id": 1,
      "site_id": 1,
      "shift_start": "2025-12-02 08:00:00",
      "shift_end": "2025-12-02 16:00:00",
      "is_overtime_shift": false
    }
  ]
}
```

---

## Employee Endpoints

### List Employees

```http
GET /employees?status=ACTIVE&search=john
Authorization: Bearer {token}
```

### Link Telegram Account

```http
POST /employees/link-telegram
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "employee_id": 1,
  "telegram_chat_id": 123456789
}
```

---

## Finance Endpoints

### Generate Payroll

```http
POST /finance/generate-payroll
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "payroll_period_id": 1
}
```

---

## Permissions

The following permissions are available:

- `view_employees`, `create_employees`, `edit_employees`, `delete_employees`
- `view_attendance`, `create_attendance`, `verify_attendance`
- `view_roster`, `create_roster`, `edit_roster`, `delete_roster`
- `view_clients`, `create_clients`, `edit_clients`, `delete_clients`
- `view_assets`, `create_assets`, `assign_assets`, `return_assets`
- `view_payroll`, `generate_payroll`, `view_invoices`, `create_invoices`
- `view_reports`, `create_reports`

### Roles

- **SUPER_ADMIN**: All permissions
- **OPS_MANAGER**: Operations and attendance management
- **HR_MANAGER**: Employee and payroll management
- **FINANCE**: Payroll and invoicing
- **SITE_SUPERVISOR**: Attendance verification and reporting
- **FIELD_STAFF**: Clock-in/out only
