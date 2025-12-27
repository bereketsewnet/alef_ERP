@echo off
echo ==========================================
echo   VERIFY DOCKER REGISTRY FIX
echo ==========================================
echo.

echo Checking Docker registry configuration...
docker info | findstr /C:"Registry Mirrors" >nul
if %errorlevel% equ 0 (
    echo [ERROR] Registry mirrors still configured!
    docker info | findstr /C:"Registry Mirrors"
    echo.
    echo Please check Docker Desktop Settings -^> Docker Engine
) else (
    echo [SUCCESS] No registry mirrors configured!
)

echo.
echo Testing Docker image pull...
echo Attempting to pull node:18-alpine (this may take a moment)...
docker pull node:18-alpine >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Docker can pull images!
    echo.
    echo You can now run: start_app.bat
) else (
    echo [WARNING] Image pull test failed.
    echo This might be normal if Docker Desktop just restarted.
    echo Wait a few seconds and try again.
)

echo.
pause

