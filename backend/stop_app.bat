@echo off
echo ==========================================
echo      ALEF DELTA ERP - STOP SCRIPT
echo ==========================================

echo Stopping API Server on port 8000...

for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    echo Killing process PID: %%a
    taskkill /f /pid %%a
)

echo.
echo ==========================================
echo      APPLICATION STOPPED
echo ==========================================
pause
