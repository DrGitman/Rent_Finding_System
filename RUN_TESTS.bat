@echo off
REM Run integration tests only (assumes services are already running)

echo.
echo ========================================================================
echo   RENT SCOUT - RUN INTEGRATION TESTS
echo ========================================================================
echo.

cd /d "%~dp0\backend"

echo Checking if services are running...
docker-compose ps | findstr /C:"Up" >nul 2>&1

if errorlevel 1 (
    echo ERROR: Services are not running!
    echo Run START_SERVICES.bat first or RUN_ALL.bat
    pause
    exit /b 1
)

echo Services are running. Installing test dependencies...
python -m pip install httpx -q

echo.
echo Running integration tests...
echo.

python tests/test_integration.py

if errorlevel 1 (
    echo.
    echo ERROR: Some tests failed
    echo This may be normal if APIs are not configured
    pause
    exit /b 1
)

echo.
echo All tests passed!
echo.

pause
