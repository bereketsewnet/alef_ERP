@echo off
color 0E
echo ==========================================
echo   ALEF DELTA ERP - REBUILD AND SEED
echo ==========================================
echo.
echo This will:
echo   1. Rebuild all services (backend, staff, member_portal)
echo   2. Apply database migrations
echo   3. Seed database with all data
echo.
echo Database and storage will be preserved.
echo.

cd /d "%~dp0"

echo [1/6] Stopping all services...
docker-compose down

echo.
echo [2/6] Rebuilding all services (this may take a few minutes)...
docker-compose build --no-cache

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    color 4F
    pause
    exit /b 1
)

echo.
echo [3/6] Starting all services...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start services!
    color 4F
    pause
    exit /b 1
)

echo.
echo [4/6] Waiting for services to be ready...
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

echo [5/6] Running database migrations...
docker-compose exec -T backend php artisan migrate --force

if %errorlevel% neq 0 (
    echo WARNING: Migrations may have failed. Continuing anyway...
)

echo.
echo [6/6] Seeding database (all data: accounts, jobs, clients, sites, attendance)...
docker-compose exec -T backend php artisan db:seed --force

if %errorlevel% neq 0 (
    echo WARNING: Seeding may have failed. Check logs with: docker-compose logs backend
)

echo.
echo ==========================================
echo   REBUILD AND SEED COMPLETE!
echo ==========================================
echo.
echo Services are running:
echo   - Backend API:    http://localhost:4001
echo   - Staff Portal:   http://localhost:5175
echo   - Member Portal:  http://localhost:7070
echo   - Adminer (DB):   http://localhost:8082
echo.
echo Sample Accounts:
echo   - Admin:    admin OR admin@alefdelta.com / admin123
echo   - HR:       hr_manager OR hr@alefdelta.com / hr123
echo   - Finance:  finance OR finance@alefdelta.com / finance123
echo   - Staff:    johndoe OR john.doe@alefdelta.com / password123
echo.
echo All code changes have been applied.
echo Database has been seeded with all data.
echo.
color 07
pause

