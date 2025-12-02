@echo off
color 4F
echo ==========================================
echo      ALEF DELTA ERP - RESET SCRIPT
echo ==========================================
echo.
echo WARNING: THIS WILL DELETE ALL DATA!
echo.
echo This command will:
echo 1. Drop all database tables
echo 2. Re-run all migrations
echo 3. Seed ONLY PRODUCTION DATA (Roles, Departments, Admin Users)
echo    * Sample data will NOT be included *
echo.
echo Press CTRL+C to cancel or any key to continue...
pause > nul

cd /d "%~dp0"

echo.
echo [1/2] Resetting Database (migrate:fresh)...
call php artisan migrate:fresh --force

echo.
echo [2/2] Seeding Production Data...
call php artisan db:seed --class=RolePermissionSeeder --force
call php artisan db:seed --class=DepartmentSeeder --force
call php artisan db:seed --class=AdminSeeder --force

echo.
echo ==========================================
echo      DATABASE RESET COMPLETE (PRODUCTION READY)
echo ==========================================
color 07
pause
