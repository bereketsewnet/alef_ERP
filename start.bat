@echo off
echo ========================================
echo  ALEF DELTA ERP - Starting Services
echo ========================================
echo.

echo [1/2] Starting Laravel Backend Server...
start "ALEF Backend" cmd /k "cd backend && php artisan serve"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Vite Frontend Server...
start "ALEF Frontend" cmd /k "cd staff && npm run dev"

echo.
echo ========================================
echo  Services Started Successfully!
echo ========================================
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
