@echo off
color 0C
echo ==========================================
echo   ALEF DELTA ERP - REBUILD FRONTEND ONLY
echo ==========================================
echo.
echo This will rebuild only the frontend services
echo (Staff Portal and Member Portal) to apply changes.
echo.
echo Backend and database will NOT be affected.
echo.

cd /d "%~dp0"

echo [1/4] Stopping frontend services...
docker-compose stop staff member_portal

echo.
echo [2/4] Rebuilding frontend services...
docker-compose build --no-cache staff member_portal

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    color 4F
    pause
    exit /b 1
)

echo.
echo [3/4] Starting frontend services...
docker-compose up -d staff member_portal

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start services!
    color 4F
    pause
    exit /b 1
)

echo.
echo [4/4] Waiting for services to be ready...
timeout /t 5 /nobreak > nul

echo.
echo ==========================================
echo   FRONTEND SERVICES REBUILT!
echo ==========================================
echo.
echo Frontend services are running:
echo   - Staff Portal:   http://localhost:5175
echo   - Member Portal:  http://localhost:7070
echo.
echo Backend API:        http://localhost:4001 (unchanged)
echo.
color 07
pause

