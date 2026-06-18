# Rent Scout - Automated Setup & Startup Guide

This guide explains how to use the batch files to set up and run the entire Rent Scout system.

## 📋 Prerequisites

Before running any batch files, ensure you have:

1. **Docker Desktop** - Download from [docker.com](https://www.docker.com/products/docker-desktop)
   - Make sure Docker Desktop is running before executing any scripts
   - Check: `docker --version` in PowerShell

2. **Python 3.11+** - Download from [python.org](https://www.python.org/)
   - Add Python to PATH during installation
   - Check: `python --version` in PowerShell

3. **Git** (Optional but recommended)

## 🚀 Quick Start (Recommended)

### Option 1: Full Setup + Tests (First Time)

Run this file to do everything in one go:

```bash
RUN_ALL.bat
```

This script will:
1. ✓ Check that Docker and Python are installed
2. ✓ Start all Docker services (PostgreSQL, Redis, Backend, n8n)
3. ✓ Initialize the database with tables
4. ✓ Install Python dependencies
5. ✓ Run verification tests
6. ✓ Run integration tests
7. ✓ Open the Listings page in your browser

**Time:** ~2 minutes

---

## 📁 Individual Batch Files

### `RUN_ALL.bat` - Full Startup with Tests
**When to use:** First-time setup or full system verification

Runs the complete startup sequence including tests.

**Output:**
- All Docker services running
- PostgreSQL database initialized with tables
- Integration tests passed
- Browser opens to [http://localhost:3000/listings](http://localhost:3000/listings)

---

### `START_SERVICES.bat` - Start Services Only
**When to use:** Daily development work

Starts Docker services without running tests.

**What it does:**
- Starts all Docker containers
- Waits 15 seconds for them to initialize
- Shows status

**Use this when:**
- You've already set up the system
- You just want to start working
- Testing is not needed

**After running:**
```
Frontend:  http://localhost:3000/listings
API Docs:  http://localhost:8000/docs
n8n:       http://localhost:5678
```

---

### `STOP_SERVICES.bat` - Stop All Services
**When to use:** When you're done working

Cleanly shuts down all Docker containers.

---

### `RUN_TESTS.bat` - Run Integration Tests Only
**When to use:** Testing without restarting services

Runs the integration test suite against running services.

**Requirements:**
- Services must already be running (use `START_SERVICES.bat` first)

**Tests verify:**
- ✓ User registration & login
- ✓ All 5 property scrapers (Zillow, Apartments, Craigslist, Facebook, WhatsApp)
- ✓ Listing CRUD operations
- ✓ AI evaluators and validators
- ✓ Webhooks

---

## 🔧 Database Initialization

The database is automatically initialized when running `RUN_ALL.bat`.

To manually initialize the database:

```bash
cd backend
python init_db.py
```

This script will:
1. Wait for PostgreSQL to be ready
2. Create all tables (users, saved_listings, automation_rules, etc.)
3. Create indexes for performance
4. Verify tables were created successfully

---

## 📊 Accessing the System

After running any startup script, access:

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | [http://localhost:3000/listings](http://localhost:3000/listings) | View rental listings |
| API Docs | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger API documentation |
| n8n | [http://localhost:5678](http://localhost:5678) | Workflow automation |
| PostgreSQL | localhost:5432 | Database (PgAdmin not included) |

---

## 🔑 Credentials

Default credentials for n8n (if accessing workflows):

```
Email: admin@rentscout.local
Password: N8n@Rent2024
```

---

## 🐛 Troubleshooting

### ❌ "Docker is not installed or not in PATH"
**Solution:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop) and make sure it's running.

### ❌ "Cannot connect to PostgreSQL"
**Solution:** 
1. Make sure Docker Desktop is running
2. Delete old containers: `docker-compose down`
3. Try again: `RUN_ALL.bat`

### ❌ "Database initialization failed"
**Solution:**
1. Stop services: `STOP_SERVICES.bat`
2. Remove containers: `docker-compose down -v` (removes volumes)
3. Try again: `RUN_ALL.bat`

### ❌ Tests fail with "Connection refused"
**Solution:** Wait 30 seconds after starting services - they take time to initialize.

---

## 📝 Useful Docker Commands

```bash
# View running services
docker-compose ps

# View logs from a service
docker-compose logs backend
docker-compose logs postgres

# Restart a service
docker-compose restart backend

# SSH into backend container
docker exec -it rentscout-backend-1 /bin/bash

# SSH into PostgreSQL container
docker exec -it rentscout-postgres-1 psql -U rentscout -d rentscout_db
```

---

## ⚙️ How Each .bat File Works

### RUN_ALL.bat Flow Chart
```
┌─────────────────────┐
│ Check Prerequisites │  (Docker, Python)
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Start Docker        │  (docker-compose up -d)
│ Services (30s)      │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Initialize Database │  (python init_db.py)
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Install Dependencies│  (pip install)
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Run Verification    │  (verify_implementation.py)
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Run Integration     │  (test_integration.py)
│ Tests               │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Open Browser        │  (http://localhost:3000/)
└─────────────────────┘
```

---

## ✅ Verification Checklist

After running `RUN_ALL.bat`, verify:

1. **Docker Services Running**
   ```bash
   docker-compose ps
   ```
   Should show all 4 services as "Up"

2. **Database Initialized**
   - Open PgAdmin or terminal
   - Connect to `localhost:5432`
   - Check tables exist: `users`, `saved_listings`, `automation_rules`, etc.

3. **Backend API Responding**
   - Visit [http://localhost:8000/docs](http://localhost:8000/docs)
   - Should show Swagger UI with endpoints

4. **Frontend Loading**
   - Visit [http://localhost:3000/listings](http://localhost:3000/listings)
   - Should show rental listings page

5. **Tests Passing**
   - See output from `test_integration.py`
   - Should show "PASS" for 13 tests

---

## 🎯 Next Steps

1. **Register a user:**
   - Visit [http://localhost:3000](http://localhost:3000)
   - Create an account
   - Set up preferences

2. **Configure API Credentials** (Optional):
   - Edit `backend/.env`
   - Add Facebook/WhatsApp/Zillow API keys
   - Restart backend: `docker-compose restart backend`

3. **Set Up Automation Rules:**
   - In the Listings page, create rules
   - Set price ranges, neighborhoods, etc.
   - System will automatically notify you

4. **Monitor Webhooks:**
   - View n8n workflows at [http://localhost:5678](http://localhost:5678)
   - Check agent activities and automation runs

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f backend`
2. Restart services: `STOP_SERVICES.bat` then `START_SERVICES.bat`
3. Fully reset: Delete `.db` files and run `RUN_ALL.bat` again

---

## 💡 Performance Tips

- Keep Docker Desktop running in background
- Use `START_SERVICES.bat` for quick daily starts (5 seconds)
- Only use `RUN_ALL.bat` for initial setup or after major changes
- Logs are verbose - check them if tests fail

---

**Happy Renting! 🏠**
