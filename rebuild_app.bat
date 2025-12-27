@echo off
color 0E
echo ==========================================
echo   ALEF DELTA ERP - REBUILD SCRIPT
echo ==========================================
echo.
echo This will rebuild all services (backend, staff, member_portal)
echo to apply code changes WITHOUT removing data.
echo.
echo Database and storage will be preserved.
echo.

cd /d "%~dp0"

echo [1/5] Stopping all services...
docker-compose down

echo.
echo [2/5] Rebuilding all services (this may take a few minutes)...
docker-compose build --no-cache

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    color 4F
    pause
    exit /b 1
)

echo.
echo [3/5] Starting all services...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start services!
    color 4F
    pause
    exit /b 1
)

echo.
echo [4/5] Waiting for services to be ready...
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

echo.
echo [5/5] Running database migrations (if needed)...
docker-compose exec -T backend php artisan migrate --force

echo.
echo ==========================================
echo   ALL SERVICES REBUILT AND RESTARTED!
echo ==========================================
echo.
echo Services are running:
echo   - Backend API:    http://localhost:4001
echo   - Staff Portal:   http://localhost:5175
echo   - Member Portal:  http://localhost:7070
echo   - Adminer (DB):   http://localhost:8082
echo.
echo All code changes have been applied.
echo Data has been preserved (database and storage).
echo.
echo To restart only: restart_app.bat
echo To stop:         stop_app.bat
echo.
color 07
pause

