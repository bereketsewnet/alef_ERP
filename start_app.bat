@echo off
color 0A
echo ==========================================
echo   ALEF DELTA ERP - DOCKER START SCRIPT
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/4] Starting Docker services...
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start Docker services!
    echo Please make sure Docker Desktop is running.
    color 4F
    pause
    exit /b 1
)

echo.
echo [2/4] Waiting for services to be ready...
timeout /t 15 /nobreak > nul

:wait_db
docker-compose exec -T db mysqladmin ping -h localhost --silent 2>nul
if %errorlevel% neq 0 (
    echo Waiting for database...
    timeout /t 3 /nobreak > nul
    goto wait_db
)

:wait_backend
docker-compose exec -T backend php --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Waiting for backend...
    timeout /t 3 /nobreak > nul
    goto wait_backend
)

echo Services are ready!
echo.

echo [3/4] Running database migrations...
docker-compose exec -T backend php artisan migrate --force

if %errorlevel% neq 0 (
    echo WARNING: Migrations may have failed. Continuing anyway...
)

echo.
echo [4/4] Seeding database (sample accounts and data)...
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
echo Seeding complete! All data has been loaded.

echo.
echo ==========================================
echo   APPLICATION STARTED SUCCESSFULLY!
echo ==========================================
echo.
echo Services are running:
echo   - Backend API:    http://localhost:4001
echo   - Staff Portal:   http://localhost:5175
echo   - Member Portal:  http://localhost:7070
echo   - Adminer (DB):   http://localhost:8082
echo.
echo Sample Accounts (use 'login' field with username OR email):
echo   - Admin:    admin OR admin@alefdelta.com / admin123
echo   - HR:       hr_manager OR hr@alefdelta.com / hr123
echo   - Finance:  finance OR finance@alefdelta.com / finance123
echo   - Staff:    johndoe OR john.doe@alefdelta.com / password123
echo.
echo NOTE: Login endpoint expects 'login' field (not 'username')
echo       You can use username, email, or phone number
echo.
echo To view logs: docker-compose logs -f
echo To stop:      stop_app.bat
echo.
color 07
pause

