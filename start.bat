@echo off
echo ========================================
echo  ALEF DELTA ERP - Starting Services
echo ========================================
echo.

echo [1/3] Starting Laravel Backend Server...
start "ALEF Backend" cmd /k "cd backend && php artisan serve"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Staff Portal (Vite)...
start "ALEF Staff Portal" cmd /k "cd staff && npm run dev"

echo [3/3] Starting Member Portal (Vite)...
start "ALEF Member Portal" cmd /k "cd member_portal && npm run dev"

echo.
echo ========================================
echo  Services Started Successfully!
echo ========================================
echo  Backend:       http://localhost:8000
echo  Staff Portal:  http://localhost:5173
echo  Member Portal: http://localhost:7070
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
