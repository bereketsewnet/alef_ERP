@echo off
echo ========================================
echo  ALEF DELTA ERP - Stopping Services
echo ========================================
echo.

echo Stopping all Node.js processes (Frontend)...
taskkill /F /IM node.exe /T >nul 2>&1

echo Stopping PHP processes (Backend)...
taskkill /F /IM php.exe /T >nul 2>&1

echo.
echo ========================================
echo  All Services Stopped!
echo ========================================
echo.
echo Press any key to exit...
pause >nul
