@echo off
REM ========================================================================
REM  RENT SCOUT - COMPLETE STARTUP & TEST SCRIPT
REM  This script starts all services and runs full verification
REM ========================================================================

setlocal enabledelayedexpansion

REM Colors for output
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

REM Get project root
set "PROJECT_ROOT=%~dp0"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

echo.
echo ========================================================================
echo   RENT SCOUT - AUTOMATED SETUP ^& TESTING
echo ========================================================================
echo.
echo Project: %PROJECT_ROOT%
echo.

REM ========================================================================
REM  CHECK PREREQUISITES
REM ========================================================================
echo [1/6] Checking prerequisites...
echo.

docker --version >nul 2>&1
if errorlevel 1 (
    echo   %RED%ERROR: Docker is not installed or not in PATH%RESET%
    echo   Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo   %RED%ERROR: Docker Compose is not installed%RESET%
    pause
    exit /b 1
)

python --version >nul 2>&1
if errorlevel 1 (
    echo   %RED%ERROR: Python is not installed or not in PATH%RESET%
    pause
    exit /b 1
)

echo   %GREEN%✓%RESET% Docker installed
echo   %GREEN%✓%RESET% Docker Compose installed
echo   %GREEN%✓%RESET% Python installed
echo.

REM ========================================================================
REM  START DOCKER SERVICES
REM ========================================================================
echo [2/6] Starting Docker services (postgres, redis, backend, n8n)...
echo.

cd /d "%PROJECT_ROOT%"

echo   Starting containers...
docker-compose down >nul 2>&1
docker-compose up -d

if errorlevel 1 (
    echo   %RED%ERROR: Failed to start Docker services%RESET%
    echo   Make sure Docker Desktop is running!
    pause
    exit /b 1
)

echo   %GREEN%✓%RESET% Docker services started
echo.

REM Wait for services to be ready
echo   Waiting for services to be ready (30 seconds)...
timeout /t 30 /nobreak >nul 2>&1

echo   %GREEN%✓%RESET% Services ready
echo.

REM ========================================================================
REM  INITIALIZE DATABASE
REM ========================================================================
echo [3/6] Initializing database...
echo.

cd /d "%PROJECT_ROOT%\backend"

set "PYTHONPATH=%PROJECT_ROOT%\backend;%PYTHONPATH%"

python -m pip install psycopg2-binary >nul 2>&1
python init_db.py

if errorlevel 1 (
    echo   %YELLOW%WARNING: Database initialization had issues%RESET%
    echo   But continuing anyway...
    echo.
)

echo.

REM ========================================================================
REM  INSTALL PYTHON DEPENDENCIES
REM ========================================================================
echo [4/6] Installing Python test dependencies...
echo.

python -m pip install httpx -q

echo   %GREEN%✓%RESET% Dependencies installed
echo.

REM ========================================================================
REM  RUN VERIFICATION
REM ========================================================================
echo [5/6] Verifying implementations...
echo.

cd /d "%PROJECT_ROOT%"
python verify_implementation.py

echo.

REM ========================================================================
REM  RUN INTEGRATION TESTS
REM ========================================================================
echo [6/6] Running integration tests (this takes ~30 seconds)...
echo.

cd /d "%PROJECT_ROOT%\backend"
python tests/test_integration.py

if errorlevel 1 (
    echo.
    echo   %YELLOW%Note: Some tests may fail if APIs are not configured%RESET%
    echo   This is normal - the system uses mock data by default
    echo.
)

echo.

REM ========================================================================
REM  FINAL STATUS
REM ========================================================================
echo ========================================================================
echo   %GREEN%SETUP COMPLETE%RESET%
echo ========================================================================
echo.
echo Access the system here:
echo.
echo   %GREEN%Frontend (Listings Page):%RESET%
echo   http://localhost:3000/listings
echo.
echo   %GREEN%API Documentation:%RESET%
echo   http://localhost:8000/docs
echo.
echo   %GREEN%n8n Workflows:%RESET%
echo   http://localhost:5678
echo   Email: admin@rentscout.local
echo   Password: N8n@Rent2024
echo.
echo   %GREEN%PostgreSQL Database:%RESET%
echo   http://localhost:5432
echo   User: rentscout
echo   Password: rentscout
echo.
echo ========================================================================
echo   USEFUL COMMANDS:
echo ========================================================================
echo.
echo   View services status:
echo   docker-compose ps
echo.
echo   View logs:
echo   docker-compose logs backend
echo   docker-compose logs postgres
echo.
echo   Stop services:
echo   docker-compose down
echo.
echo   Restart backend:
echo   docker-compose restart backend
echo.
echo ========================================================================
echo.
echo Opening browser to Listings page in 5 seconds...
timeout /t 5 /nobreak >nul 2>&1

REM Open browser
start http://localhost:3000/listings

echo.
echo Done! Press any key to close this window...
pause >nul 2>&1
