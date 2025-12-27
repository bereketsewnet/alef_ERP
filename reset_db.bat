@echo off
color 4F
echo ==========================================
echo   ALEF DELTA ERP - RESET DATABASE
echo ==========================================
echo.
echo WARNING: This will DELETE ALL DATA and recreate the database!
echo.
echo This will:
echo   1. Drop all tables
echo   2. Re-run migrations
echo   3. Seed sample data (accounts, employees, etc.)
echo.
echo Press CTRL+C to cancel or any key to continue...
pause > nul

cd /d "%~dp0"

echo Checking if services are running...
docker-compose ps | findstr "Up" > nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Docker services are not running!
    echo Please run start_app.bat first.
    pause
    exit /b 1
)

echo.
echo [1/3] Resetting database (migrate:fresh)...
docker-compose exec -T backend php artisan migrate:fresh --force

if %errorlevel% neq 0 (
    echo ERROR: Database reset failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Seeding roles and departments...
docker-compose exec -T backend php artisan db:seed --class=RolePermissionSeeder --force
docker-compose exec -T backend php artisan db:seed --class=DepartmentSeeder --force

echo.
echo [3/3] Seeding admin accounts and sample data...
docker-compose exec -T backend php artisan db:seed --force

echo.
echo ==========================================
echo   DATABASE RESET COMPLETE!
echo ==========================================
echo.
echo Sample Accounts:
echo   - Admin:    admin@alefdelta.com / admin123
echo   - HR:       hr@alefdelta.com / hr123
echo   - Finance:  finance@alefdelta.com / finance123
echo   - Staff:    johndoe / password123
echo.
color 07
pause

