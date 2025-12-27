@echo off
color 0B
echo ==========================================
echo   ALEF DELTA ERP - RESTART SCRIPT
echo ==========================================
echo.
echo This will restart all services WITHOUT removing data.
echo (Database and storage will be preserved)
echo.

cd /d "%~dp0"

echo [1/3] Stopping all services...
docker-compose down

echo.
echo [2/3] Starting all services...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start services!
    color 4F
    pause
    exit /b 1
)

echo.
echo [3/3] Waiting for services to be ready...
timeout /t 10 /nobreak > nul

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
echo ==========================================
echo   SERVICES RESTARTED SUCCESSFULLY!
echo ==========================================
echo.
echo Services are running:
echo   - Backend API:    http://localhost:4001
echo   - Staff Portal:   http://localhost:5175
echo   - Member Portal:  http://localhost:7070
echo   - Adminer (DB):   http://localhost:8082
echo.
echo Data has been preserved (database and storage).
echo.
echo To rebuild with changes: rebuild_app.bat
echo To stop:                 stop_app.bat
echo.
color 07
pause

