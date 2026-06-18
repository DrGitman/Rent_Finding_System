@echo off
REM Quick start Docker services only (no tests)

echo.
echo ========================================================================
echo   RENT SCOUT - START SERVICES ONLY
echo ========================================================================
echo.

cd /d "%~dp0"

echo Starting Docker services...
docker-compose up -d

if errorlevel 1 (
    echo ERROR: Failed to start services
    echo Make sure Docker Desktop is running!
    pause
    exit /b 1
)

echo.
echo Services started! Waiting 15 seconds for them to initialize...
timeout /t 15 /nobreak >nul 2>&1

echo.
echo Status:
docker-compose ps

echo.
echo Services are ready!
echo.
echo Access URLs:
echo   Frontend:  http://localhost:3000/listings
echo   API Docs:  http://localhost:8000/docs
echo   n8n:       http://localhost:5678
echo.

pause
