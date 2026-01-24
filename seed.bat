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
echo Running seeders individually to ensure all data is created...

REM Run seeders in correct order
echo.
echo Running RolePermissionSeeder...
docker-compose exec -T backend php artisan db:seed --class=RolePermissionSeeder --force
if %errorlevel% neq 0 (
    echo WARNING: RolePermissionSeeder failed, but continuing...
)

echo.
echo Running DepartmentSeeder...
docker-compose exec -T backend php artisan db:seed --class=DepartmentSeeder --force
if %errorlevel% neq 0 (
    echo WARNING: DepartmentSeeder failed, but continuing...
)

echo.
echo Running AdminSeeder...
docker-compose exec -T backend php artisan db:seed --class=AdminSeeder --force
if %errorlevel% neq 0 (
    echo WARNING: AdminSeeder failed, but continuing...
)

echo.
echo Running JobCategorySeeder...
docker-compose exec -T backend php artisan db:seed --class=JobCategorySeeder --force
if %errorlevel% neq 0 (
    echo WARNING: JobCategorySeeder failed, but continuing...
)

echo.
echo Running JobSeeder...
docker-compose exec -T backend php artisan db:seed --class=JobSeeder --force
if %errorlevel% neq 0 (
    echo WARNING: JobSeeder failed, but continuing...
)

echo.
echo Running ClientSeeder...
docker-compose exec -T backend php artisan db:seed --class=ClientSeeder --force
if %errorlevel% neq 0 (
    echo WARNING: ClientSeeder failed, but continuing...
)

echo.
echo Running ClientSiteSeeder...
docker-compose exec -T backend php artisan db:seed --class=ClientSiteSeeder --force
if %errorlevel% neq 0 (
    echo WARNING: ClientSiteSeeder failed, but continuing...
)

echo.
echo Running SampleDataSeeder...
docker-compose exec -T backend php artisan db:seed --class=SampleDataSeeder --force
if %errorlevel% neq 0 (
    echo WARNING: SampleDataSeeder failed, but continuing...
)

echo.
echo Running ShiftScheduleSeeder...
docker-compose exec -T backend php artisan db:seed --class=ShiftScheduleSeeder --force
if %errorlevel% neq 0 (
    echo WARNING: ShiftScheduleSeeder failed, but continuing...
)

echo.
echo Running AttendanceSeeder...
docker-compose exec -T backend php artisan db:seed --class=AttendanceSeeder --force
if %errorlevel% neq 0 (
    echo WARNING: AttendanceSeeder failed, but continuing...
)

echo.
echo Running SyncUserPhones...
docker-compose exec -T backend php artisan db:seed --class=SyncUserPhones --force
if %errorlevel% neq 0 (
    echo WARNING: SyncUserPhones failed, but continuing...
)

REM Check if assets table exists before seeding
docker-compose exec -T db mysql -uroot -proot -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'alef_erp' AND table_name = 'assets';" alef_erp 2>nul | findstr /C:"1" > nul
if %errorlevel% equ 0 (
    echo.
    echo Running AssetSeeder...
    docker-compose exec -T backend php artisan db:seed --class=AssetSeeder --force
    if %errorlevel% neq 0 (
        echo WARNING: AssetSeeder failed, but continuing...
    )
) else (
    echo.
    echo INFO: Assets table does not exist, skipping AssetSeeder...
)

echo.
echo ==========================================
echo   DATABASE SEEDED SUCCESSFULLY!
echo ==========================================
echo.
echo Sample Accounts:
echo   - Admin:    admin@alefdelta.com / admin123
echo   - HR:       hr@alefdelta.com / hr123
echo   - Finance:  finance@alefdelta.com / finance123
echo   - Staff:    johndoe / password123 (Phone: +251911234567)
echo.
echo Seeded Data:
echo   - Roles and Permissions
echo   - Departments
echo   - Job Categories and Jobs
echo   - Clients and Client Sites
echo   - Employees and Users
echo   - Shift Schedules
echo   - Attendance Logs
echo   - Assets (if table exists)
echo   - Phone numbers synced
echo.

color 07
pause

