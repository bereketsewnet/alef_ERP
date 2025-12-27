@echo off
color 4F
echo ==========================================
echo   ALEF DELTA ERP - DOCKER STOP SCRIPT
echo ==========================================
echo.
echo WARNING: This will stop all services and REMOVE ALL DATA!
echo (Volumes will be deleted - database, storage, etc.)
echo.
echo Press CTRL+C to cancel or any key to continue...
pause > nul

cd /d "%~dp0"

echo.
echo [1/2] Stopping all Docker services...
docker-compose down

echo.
echo [2/2] Removing volumes (deleting all data)...
docker-compose down -v

echo.
echo ==========================================
echo   ALL SERVICES STOPPED AND DATA REMOVED
echo ==========================================
echo.
echo To start again: start_app.bat
echo.
color 07
pause

