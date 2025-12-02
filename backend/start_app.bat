@echo off
echo ==========================================
echo      ALEF DELTA ERP - START SCRIPT
echo ==========================================

cd /d "%~dp0"

echo [1/3] Running Database Migrations...
call php artisan migrate --force

echo [2/3] Seeding Database...
echo (Note: This may show errors if data already exists)
call php artisan db:seed --force

echo [3/3] Starting API Server...
echo API will be available at http://127.0.0.1:8000
echo Close the new window to stop the server manually.

start "ALEF DELTA ERP API SERVER" php artisan serve

echo.
echo ==========================================
echo      APPLICATION STARTED SUCCESSFULLY
echo ==========================================
timeout /t 5
