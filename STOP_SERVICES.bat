@echo off
REM Stop all Docker services

echo.
echo ========================================================================
echo   RENT SCOUT - STOP SERVICES
echo ========================================================================
echo.

cd /d "%~dp0"

echo Stopping Docker services...
docker-compose down

if errorlevel 1 (
    echo ERROR: Failed to stop services
    pause
    exit /b 1
)

echo.
echo Services stopped!
echo.

pause
