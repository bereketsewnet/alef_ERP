# ALEF DELTA ERP - Development & Deployment Checklist

## Local Development Setup

- [x] ✅ Install PHP 8.2.12
- [x] ✅ Install PostgreSQL 16
- [x] ✅ Install Composer
- [x] ✅ Enable `pdo_pgsql` and `pgsql` extensions in `php.ini`
- [x] ✅ Create PostgreSQL database `alef_erp`
- [x] ✅ Create Laravel project in `C:\xampp\htdocs\Alef_ERP\backend`
- [x] ✅ Configure `.env` with database credentials
- [x] ✅ Run migrations (`php artisan migrate`)
- [ ] 🔄 Run seeders (`php artisan db:seed`)
- [ ] 🔄 Generate JWT secret (`php artisan jwt:secret`)
- [ ] 🔄 Start development server (`php artisan serve`)
- [ ] 🔄 Test API endpoints with Postman

## Management Scripts (Windows)

Located in `backend/` folder:

- **`start_app.bat`**: Runs migrations, seeds (all data), and starts the API server. (In PowerShell, run as `.\start_app.bat`)
- **`stop_app.bat`**: Stops the API server running on port 8000. (In PowerShell, run as `.\stop_app.bat`)
- **`reset_db.bat`**: **WARNING** - Resets database and seeds ONLY production data. (In PowerShell, run as `.\reset_db.bat`)

## Testing

- [ ] 🔄 Write unit tests for GPS validation service
- [ ] 🔄 Write feature tests for authentication endpoints
- [ ] 🔄 Write feature tests for attendance clock-in/out
- [ ] 🔄 Write tests for payroll calculations
- [ ] 🔄 Run full test suite (`php artisan test`)

## Telegram Bot Setup

- [ ] 🔄 Create Telegram bot via BotFather
- [ ] 🔄 Get bot token and add to `.env` (`TELEGRAM_BOT_TOKEN`)
- [ ] 🔄 Create Node.js bot project in `/telegram-bot-starter`
- [ ] 🔄 Setup webhook to receive Telegram updates
- [ ] 🔄 Test Mini App authentication flow

## API Documentation

- [ ] 🔄 Generate OpenAPI/Swagger spec
- [ ] 🔄 Create Postman collection for all endpoints
- [ ] 🔄 Test all endpoints manually

## Production Deployment (cPanel)

### Pre-Deployment

- [ ] 🔄 Check cPanel PHP version (must be 8.2+)
- [ ] 🔄 Setup managed PostgreSQL or external DB server
- [ ] 🔄 Purchase SSL certificate or use Lets Encrypt
- [ ] 🔄 Test on staging environment

### Deployment Steps

- [ ] 🔄 Upload project files to cPanel
- [ ] 🔄 Run `composer install --optimize-autoloader --no-dev`
- [ ] 🔄 Copy `.env.example` to `.env` and configure
- [ ] 🔄 Generate app key (`php artisan key:generate`)
- [ ] 🔄 Generate JWT secret (`php artisan jwt:secret`)
- [ ] 🔄 Run migrations (`php artisan migrate --force`)
- [ ] 🔄 Set storage permissions (`chmod -R 755 storage bootstrap/cache`)
- [ ] 🔄 Link storage (`php artisan storage:link`)
- [ ] 🔄 Setup cron job for Laravel scheduler
- [ ] 🔄 Setup queue worker (Supervisor or cron)
- [ ] 🔄 Point domain to `public` directory
- [ ] 🔄 Enable HTTPS
- [ ] 🔄 Test all critical endpoints in production

### Post-Deployment

- [ ] 🔄 Monitor error logs
- [ ] 🔄 Setup database backups
- [ ] 🔄 Setup application monitoring (e.g., Sentry)
- [ ] 🔄 Document deployment process
- [ ] 🔄 Train admin users

## Additional Features (Future)

- [ ] 📝 Export attendance reports to Excel
- [ ] 📝 Generate PDF payslips
- [ ] 📝 Email notifications for payroll
- [ ] 📝 Slack/Telegram notifications for panic alerts
- [ ] 📝 Dashboard with charts and metrics
- [ ] 📝 Asset QR code scanning
- [ ] 📝 Geofencing for multiple sites
- [ ] 📝 Shift swap requests
- [ ] 📝 Leave management
- [ ] 📝 Performance reviews

---

**Legend:**  
✅ = Completed  
🔄 = In Progress / To Do  
📝 = Planned
