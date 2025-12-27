@echo off
color 0D
echo ==========================================
echo   ALEF DELTA ERP - REBUILD BACKEND ONLY
echo ==========================================
echo.
echo This will rebuild only the backend service
echo to apply code changes.
echo.
echo Frontend services and database will NOT be affected.
echo.

cd /d "%~dp0"

echo [1/4] Stopping backend service...
docker-compose stop backend

echo.
echo [2/4] Rebuilding backend service...
docker-compose build --no-cache backend

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    color 4F
    pause
    exit /b 1
)

echo.
echo [3/4] Starting backend service...
docker-compose up -d backend

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start service!
    color 4F
    pause
    exit /b 1
)

echo.
echo [4/4] Waiting for backend to be ready...
timeout /t 10 /nobreak > nul

:wait_backend
docker-compose exec -T backend php --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Waiting for backend...
    timeout /t 3 /nobreak > nul
    goto wait_backend
)

echo.
echo Running migrations (if needed)...
docker-compose exec -T backend php artisan migrate --force

echo.
echo ==========================================
echo   BACKEND SERVICE REBUILT!
echo ==========================================
echo.
echo Backend API:        http://localhost:4001
echo.
echo Frontend services:   (unchanged)
echo   - Staff Portal:   http://localhost:5175
echo   - Member Portal:  http://localhost:7070
echo.
color 07
pause

