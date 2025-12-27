@echo off
color 0C
echo ==========================================
echo   ALEF DELTA ERP - DATABASE SETUP
echo ==========================================
echo.
echo This will:
echo   1. Run database migrations (create tables)
echo   2. Seed database with all data
echo.
echo Make sure services are running first!
echo.

cd /d "%~dp0"

echo Checking if services are running...
docker-compose ps | findstr "Up" > nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Docker services are not running!
    echo Please run start_app.bat first.
    color 4F
    pause
    exit /b 1
)

echo.
echo [1/2] Running database migrations...
docker-compose exec -T backend php artisan migrate --force

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Migrations failed!
    color 4F
    pause
    exit /b 1
)

echo.
echo [2/2] Seeding database (all data)...
echo Running seeders individually to ensure all data is created...
docker-compose exec -T backend php artisan db:seed --class=JobCategorySeeder --force
docker-compose exec -T backend php artisan db:seed --class=JobSeeder --force
docker-compose exec -T backend php artisan db:seed --class=ClientSeeder --force
docker-compose exec -T backend php artisan db:seed --class=ClientSiteSeeder --force
docker-compose exec -T backend php artisan db:seed --class=AdminSeeder --force
docker-compose exec -T backend php artisan db:seed --class=SampleDataSeeder --force
docker-compose exec -T backend php artisan db:seed --class=ShiftScheduleSeeder --force
docker-compose exec -T backend php artisan db:seed --class=AttendanceSeeder --force
docker-compose exec -T backend php artisan db:seed --class=AssetSeeder --force

echo.
if %errorlevel% neq 0 (
    echo WARNING: Some seeders may have failed (this is normal if data already exists).
    echo Check logs with: docker-compose logs backend
    color 4F
) else (
    echo.
    echo ==========================================
    echo   DATABASE SETUP COMPLETE!
    echo ==========================================
    echo.
    echo Sample Accounts:
    echo   - Admin:    admin OR admin@alefdelta.com / admin123
    echo   - HR:       hr_manager OR hr@alefdelta.com / hr123
    echo   - Finance:  finance OR finance@alefdelta.com / finance123
    echo   - Staff:    johndoe OR john.doe@alefdelta.com / password123
    echo.
    color 0A
)

color 07
pause

