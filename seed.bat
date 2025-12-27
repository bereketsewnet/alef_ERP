@echo off
color 0B
echo ==========================================
echo   ALEF DELTA ERP - SEED DATABASE
echo ==========================================
echo.
echo This will apply seed data (sample accounts, etc.)
echo to the existing database.
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
echo [1/2] Running database migrations (if needed)...
docker-compose exec -T backend php artisan migrate --force

echo.
echo [2/2] Seeding database...
docker-compose exec -T backend php artisan db:seed --force

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo   DATABASE SEEDED SUCCESSFULLY!
    echo ==========================================
    echo.
    echo Sample Accounts:
    echo   - Admin:    admin@alefdelta.com / admin123
    echo   - HR:       hr@alefdelta.com / hr123
    echo   - Finance:  finance@alefdelta.com / finance123
    echo   - Staff:    johndoe / password123
    echo.
) else (
    echo.
    echo ERROR: Seeding failed!
    echo Check logs with: docker-compose logs backend
    color 4F
)

color 07
pause

