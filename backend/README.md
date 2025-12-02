# ALEF DELTA ERP - Backend

Production-ready Laravel 12 backend for manpower supply ERP featuring Rostering, GPS-verified Attendance (Telegram Mini App), Asset Tracking, Payroll & Billing.

## Features

- 🔐 **Multi-Auth**: JWT API tokens + Telegram Mini App authentication
- 📍 **GPS Attendance**: Haversine-based location verification for clock-in/out
- 📅 **Smart Rostering**: Conflict detection and bulk shift assignments
- 💰 **Payroll**: Automated calculation with progressive tax, pension, deductions
- 📦 **Asset Management**: Track assignments, returns, termination checks
- 🚗 **Fleet Tracking**: Vehicle trip logs and fuel management
- 📊 **Reporting**: Attendance logs, missed shifts, operational incidents

## Tech Stack

- **Framework**: Laravel 12
- **Database**: PostgreSQL 16
- **Authentication**: tymon/jwt-auth
- **Permissions**: spatie/laravel-permission
- **PDF**: barryvdh/laravel-dompdf
- **Queue**: Redis

## Prerequisites

- PHP 8.2+
- PostgreSQL 16
- Composer
- Redis (optional, for queues)

## Local Setup (Windows 11 - XAMPP)

### 1. Clone / Navigate to Project

```bash
cd C:\xampp\htdocs\Alef_ERP\backend
```

### 2. Configure PHP Extensions

Edit `C:\xampp\php\php.ini` and uncomment:

```ini
extension=pdo_pgsql
extension=pgsql
```

Restart Apache/PHP-FPM.

### 3. Install Dependencies

```bash
composer install
```

### 4. Environment Configuration

The `.env` file should already be configured. Verify:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=alef_erp
DB_USERNAME=postgres
DB_PASSWORD=postgres

TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_MINI_APP_URL=https://your-mini-app.com
```

### 5. Generate Keys

```bash
php artisan key:generate
php artisan jwt:secret
```

### 6. Run Migrations

```bash
php artisan migrate
```

### 7. Seed Database (Optional)

```bash
php artisan db:seed
```

### 8. Start Development Server

```bash
php artisan serve
```

API will be available at: `http://localhost:8000/api`

## Database Schema

- **21 Tables** covering:
  - Auth & RBAC (users, permissions)
  - HR (departments, job_roles, employees)
  - Operations (clients, sites, contracts, shifts, attendance)
  - Assets & Fleet (assets, assignments, vehicle_trip_logs)
  - Finance (payroll_periods, payslips, invoices)
  - Incidents (operational_reports)

## Core API Endpoints

### Authentication

```
POST   /api/auth/login          - Admin login (username/password)
POST   /api/auth/telegram       - Telegram Mini App login (initData)
POST   /api/auth/refresh        - Refresh JWT token
GET    /api/auth/me             - Get current user
POST   /api/auth/logout         - Logout
```

### Attendance

```
POST   /api/attendance/clock-in  - Clock in (GPS-verified)
POST   /api/attendance/clock-out - Clock out
GET    /api/attendance/logs      - Get attendance logs (admin)
GET    /api/attendance/my-logs   - Get my logs (employee)
```

### Roster

```
POST   /api/roster/bulk-assign  - Bulk shift assignment
GET    /api/roster/my-roster    - Get my upcoming shifts
GET    /api/roster              - Get all rosters (admin)
```

### Employees

```
GET    /api/employees           - List employees
POST   /api/employees           - Create employee
GET    /api/employees/{id}      - Get employee details
PUT    /api/employees/{id}      - Update employee
POST   /api/employees/link-telegram - Link Telegram account
```

## Business Logic Services

### GPS Validation

**Location**: `app/Services/GpsValidationService.php`

Uses Haversine formula to calculate distance between employee location and site coordinates.

```php
$gpsService->isWithinRadius($lat, $lng, $site);
// Returns: ['withinRadius' => bool, 'distanceMeters' => float]
```

### Attendance

**Location**: `app/Services/AttendanceService.php`

Validates clock-in/out with GPS verification, punctuality tracking, and audit logging.

### Payroll

**Location**: `app/Services/PayrollService.php`

Calculates payroll with progressive tax (Ethiopian tax brackets), 7% pension deduction, cost sharing, and penalty deductions.

### Roster

**Location**: `app/Services/RosterService.php`

Manages shift scheduling with conflict detection to prevent overlapping assignments.

### Asset

**Location**: `app/Services/AssetService.php`

Tracks asset assignments, returns, and calculates deductions for unreturned assets during termination.

## Telegram Mini App Integration

### Server-Side Validation

**Service**: `app/Services/TelegramAuthService.php`

Validates `initData` from Telegram Mini App using HMAC-SHA256:

```php
$telegramUser = $telegramAuthService->validateInitData($initData);
$user = $telegramAuthService->findOrCreateUser($telegramUser);
```

### Client-Side (Bot)

A minimal Node.js bot starter is included in `/telegram-bot-starter` (if created).

## cPanel Deployment

### Prerequisites

- cPanel with PHP 8.2+ support
- PostgreSQL 16 (managed or external)
- SSH access (recommended)

### Steps

1. **Upload Files**

   - Upload project via Git or FTP
   - Path: `/home/{user}/alef_erp_backend`

2. **Install Dependencies**

   ```bash
   composer install --optimize-autoloader --no-dev
   ```

3. **Configure Environment**

   ```bash
   cp .env.example .env
   php artisan key:generate
   php artisan jwt:secret
   ```

   Update `.env` with production values:

   ```env
   APP_ENV=production
   APP_DEBUG=false
   DB_HOST=your_postgres_host
   DB_DATABASE=your_db_name
   DB_USERNAME=your_db_user
   DB_PASSWORD=your_db_password
   ```

4. **Run Migrations**

   ```bash
   php artisan migrate --force
   ```

5. **Storage Permissions**

   ```bash
   chmod -R 755 storage bootstrap/cache
   php artisan storage:link
   ```

6. **Setup Cron**

   Add to cron jobs:

   ```
   * * * * * cd /home/{user}/alef_erp_backend && php artisan schedule:run >> /dev/null 2>&1
   ```

7. **Public Directory**

   Point domain to `/home/{user}/alef_erp_backend/public`

8. **Queues (Optional)**

   For background jobs, use Supervisor or cron:

   ```
   * * * * * cd /home/{user}/alef_erp_backend && php artisan queue:work --tries=3 --timeout=90
   ```

9. **SSL Certificate**

   Enable HTTPS via cPanel's Auto SSL or Let's Encrypt.

## Testing

### Unit Tests

```bash
php artisan test --filter=GpsValidationTest
php artisan test --filter=PayrollServiceTest
```

### Feature Tests

```bash
php artisan test --filter=AttendanceTest
php artisan test --filter=AuthTest
```

### Full Test Suite

```bash
php artisan test
```

## Project Structure

```
backend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Api/
│   │           ├── AuthController.php
│   │           ├── AttendanceController.php
│   │           ├── RosterController.php
│   │           └── ...
│   ├── Models/
│   │   ├── User.php
│   │   ├── Employee.php
│   │   ├── ShiftSchedule.php
│   │   └── ...
│   └── Services/
│       ├── GpsValidationService.php
│       ├── AttendanceService.php
│       ├── PayrollService.php
│       └── ...
├── config/
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
└── tests/
```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure `pdo_pgsql` extension is enabled

### JWT Token Issues

- Run `php artisan jwt:secret` if not generated
- Check `JWT_SECRET` in `.env`
- Clear config cache: `php artisan config:clear`

### GPS Validation Always Fails

- Verify site coordinates are correct
- Check `geo_radius_meters` setting (default: 100m)
- Test with known coordinates

## Security

- All passwords hashed with bcrypt
- JWT tokens with configurable expiry
- Rate limiting on auth endpoints
- Input validation on all requests
- Audit logging for sensitive operations

## License

Proprietary - ALEF DELTA

## Support

For issues or questions, contact the development team.
