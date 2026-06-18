# 🚀 RENT SCOUT - COMPLETE RUNBOOK

Complete step-by-step guide to run and test everything. Follow this exactly as written.

---

## Prerequisites (Do This First)

### 1. Docker Desktop
- **Required for:** Running PostgreSQL, Redis, n8n, Backend
- **Download:** https://www.docker.com/products/docker-desktop
- **Verify:** Open PowerShell and run:
  ```powershell
  docker --version
  docker-compose --version
  ```
- **Should see:** `Docker version 24+` and `Docker Compose version 2+`

### 2. Python 3.11+
- **Required for:** Running integration tests
- **Verify:** 
  ```powershell
  python --version
  ```
- **Should see:** `Python 3.11.x` or higher

### 3. Node.js 18+
- **Required for:** Frontend development (optional)
- **Verify:**
  ```powershell
  node --version
  npm --version
  ```
- **Should see:** `v18+` and `npm 9+`

---

## STEP 1: Start All Services (5-10 minutes)

### 1.1 Open PowerShell and Navigate to Project

```powershell
cd "d:\personal projects 2\Rent Finding System\Rent Scout"
```

### 1.2 Start Docker Services

**IMPORTANT:** Make sure Docker Desktop is running first!

```powershell
docker-compose up -d
```

**Output should show:**
```
[+] Running 4/4
 ✓ Container rentscout-postgres-1  Started
 ✓ Container rentscout-redis-1     Started
 ✓ Container rentscout-backend-1   Started
 ✓ Container rentscout-n8n-1       Started
```

### 1.3 Verify Services Are Running

```powershell
docker-compose ps
```

**All 4 should show "Up":**
```
NAME                    STATUS
rentscout-postgres-1    Up 2 minutes
rentscout-redis-1       Up 2 minutes
rentscout-backend-1     Up 2 minutes
rentscout-n8n-1         Up 2 minutes
```

**If any show "Exited":**
```powershell
# Check logs for errors
docker-compose logs backend
docker-compose logs postgres

# Restart:
docker-compose restart
```

### 1.4 Wait for Backend to Be Ready

```powershell
# Test backend health
$null = 0
while ($null -lt 30) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Backend is ready!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "Waiting for backend... ($null seconds)" -ForegroundColor Yellow
        Start-Sleep -Seconds 1
        $null++
    }
}
```

**OR simply wait 10 seconds:**
```powershell
Start-Sleep -Seconds 10
```

---

## STEP 2: Run Verification Script (2 minutes)

This verifies all implementations are in place without needing external dependencies:

```powershell
cd "d:\personal projects 2\Rent Finding System\Rent Scout"
python verify_implementation.py
```

**Expected Output:**
```
✓ PASS | Task 1: Frontend Listings UI
✓ PASS | Task 2: Integration Testing Script  
✓ PASS | Task 3: API Credentials Support

Overall: 3/3 tasks verified
Status: ✓ ALL TASKS COMPLETE
```

---

## STEP 3: Run Integration Tests (5-10 minutes)

This tests all API endpoints and workflows end-to-end.

### 3.1 Install Test Dependencies

```powershell
cd "d:\personal projects 2\Rent Finding System\Rent Scout\backend"
python -m pip install httpx
```

### 3.2 Run the Tests

```powershell
python tests/test_integration.py
```

**You'll see tests running:**
```
======================================================================
  RENT FINDING SYSTEM - END-TO-END INTEGRATION TEST SUITE
======================================================================

📋 AUTHENTICATION TESTS
--
[12:35:42] SUCCESS | ✓ User Registration
  └─ Created user: test-1234567890@rentfinder.local
[12:35:43] SUCCESS | ✓ User Login
  └─ Token obtained: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV1QifQ...

📡 SCRAPER TESTS
--
[12:35:44] SUCCESS | ✓ Zillow Scraper
  └─ Retrieved 10 listings from Zillow
[12:35:45] SUCCESS | ✓ Facebook Marketplace Scraper
  └─ Retrieved 2 listings
[12:35:46] SUCCESS | ✓ WhatsApp Groups Extractor
  └─ Retrieved 2 property messages
...
(continuing with all 13 tests)
```

**Final Results:**
```
======================================================================
  TEST SUMMARY
======================================================================
✓ Passed: 13
✗ Failed: 0
Total:  13
Success Rate: 100%

======================================================================
```

✅ **If you see "Success Rate: 100%", everything is working!**

---

## STEP 4: Test Frontend UI (5 minutes)

### 4.1 Check If Frontend Is Running

```powershell
# Test frontend
Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue | Select-Object StatusCode
```

**If you get `StatusCode: 200`**, frontend is running. Go to Step 4.2.

**If you get an error**, start it manually:
```powershell
cd "d:\personal projects 2\Rent Finding System\Rent Scout"
npm run dev
```

### 4.2 Open Frontend in Browser

**Click this link or open in your browser:**
```
http://localhost:3000/listings
```

### 4.3 Test Listings Page Features

**You should see:**
- ✅ List of rental properties with images
- ✅ Left sidebar with filters (Source, Price, AI Score, Scam Risk)
- ✅ Sorting dropdown
- ✅ Pagination buttons
- ✅ Color-coded badges for AI score and scam risk

**Test Each Feature:**

#### 1. **Filter by Source**
- Click "Source" dropdown (left panel)
- Select "zillow"
- Results should filter
- ✅ Listing count should change

#### 2. **Adjust Price Range**
- Move the price sliders on left
- Set to $1000-$2000
- ✅ Only listings in that price range should show

#### 3. **Click a Listing**
- Click "View Details" on any listing
- ✅ Side panel should open with full details
- ✅ Should show title, price, AI score, scam risk, notes

#### 4. **Test Pagination**
- Set "Items per page" to 5
- Click "Next" button
- ✅ New listings should load

#### 5. **Test Sorting**
- Click "Sort By" dropdown
- Select "Price: High to Low"
- ✅ Listings should sort by price descending

✅ **If all features work, UI is verified!**

---

## STEP 5: Test n8n Workflows (3 minutes)

### 5.1 Open n8n Dashboard

**Click this link or open in your browser:**
```
http://localhost:5678
```

### 5.2 Login

- **Email:** admin@rentscout.local
- **Password:** N8n@Rent2024

### 5.3 View Workflows

**You should see 2 workflows:**
- ✅ "Rental Listing Scanner"
- ✅ "Property Evaluator"

**If you only see 1 workflow**, the Scam Detector workflow needs to be imported (see Troubleshooting below).

### 5.4 Test Workflow Execution

1. Click on "Rental Listing Scanner"
2. Click the blue **Execute Workflow** button (or play icon)
3. Watch the nodes execute
4. ✅ Should complete without errors

**Check Execution History:**
- Click on "Executions" tab
- ✅ Should show completed runs with timestamps

---

## STEP 6: Verify Backend APIs (3 minutes)

### 6.1 Open API Documentation

**Click this link or open in your browser:**
```
http://localhost:8000/docs
```

### 6.2 Test an Endpoint

**Example: Get Listings**

1. Find the **GET /api/listings** endpoint (green)
2. Click "Try it out"
3. Leave parameters empty
4. Click "Execute"
5. ✅ Should see response with status 200 and listings data

**Example: Create a Listing**

1. Find the **POST /api/listings** endpoint
2. Click "Try it out"
3. In the request body, paste:
   ```json
   {
     "title": "Test Apartment",
     "price": 1500,
     "source": "zillow",
     "url": "https://example.com/listing",
     "ai_score": 85,
     "scam_risk": 10
   }
   ```
4. Click "Execute"
5. ✅ Should return 200 with new listing ID

---

## STEP 7: Check Database (2 minutes)

### 7.1 Connect to PostgreSQL

```powershell
docker exec -it rentscout-postgres-1 psql -U rentscout -d rentscout_db
```

### 7.2 Query Data

```sql
-- See how many listings exist
SELECT COUNT(*) as total_listings FROM saved_listing;

-- See all listings
SELECT id, title, price, source, ai_score, scam_risk FROM saved_listing LIMIT 5;

-- See users
SELECT id, email, full_name FROM "user";
```

**Exit psql:**
```
\q
```

---

## STEP 8: (Optional) Add Real API Credentials

To use real property data instead of mock data:

### 8.1 Choose an API

**Easiest Option:** Twilio WhatsApp (free trial: $15 credit)
- Go to https://www.twilio.com/console
- Sign up for free
- Follow CREDENTIALS_SETUP.md section "Option B: Twilio WhatsApp Integration"

**Or:** Facebook Marketplace API
- Go to https://developers.facebook.com/apps
- Create an app
- Follow CREDENTIALS_SETUP.md section "Facebook Marketplace Integration"

### 8.2 Add to .env File

```bash
# Copy template
cp .env.example .env

# Edit .env with your credentials
# Add one or more:
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890

# OR
FACEBOOK_ACCESS_TOKEN=your-token
```

### 8.3 Restart Backend

```powershell
docker-compose restart backend
```

### 8.4 Re-run Tests

```powershell
python backend/tests/test_integration.py
```

✅ Tests will now use real APIs instead of mock data

---

## COMPLETE VERIFICATION CHECKLIST

After following all steps above, verify everything with this checklist:

- [ ] Docker services all running (`docker-compose ps` shows 4 "Up")
- [ ] Implementation script passes (`python verify_implementation.py` → 3/3 PASS)
- [ ] All 13 tests pass (`python tests/test_integration.py` → 100% success)
- [ ] Frontend loads (`http://localhost:3000/listings` shows listings)
- [ ] Filters work (can select source, price, scores)
- [ ] Listing details modal opens (click "View Details")
- [ ] Pagination works (click "Next", see new listings)
- [ ] n8n dashboard loads (`http://localhost:5678` → 2 workflows visible)
- [ ] API docs load (`http://localhost:8000/docs` → interactive UI)
- [ ] Can query database (connected successfully)

**If all checked, your system is 100% working!** ✅

---

## TROUBLESHOOTING

### Problem: Docker services won't start

**Error:** `error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine": ...`

**Solution:**
1. Make sure Docker Desktop app is running (check taskbar)
2. Open Docker Desktop
3. Wait 30 seconds for it to fully start
4. Try again: `docker-compose up -d`

---

### Problem: Backend won't start

**Error:** `rentscout-backend-1 Exited (1)`

**Solution:**
```powershell
# Check logs
docker-compose logs backend

# If it's a PyJWT error, it's already fixed in the codebase
# Just restart:
docker-compose down
docker-compose up -d
```

---

### Problem: Tests fail with "Connection refused"

**Error:** `Connection refused at http://localhost:8000`

**Solution:**
1. Verify backend is running: `docker-compose ps`
2. Wait longer (backend takes 10-20 seconds to start)
3. Check if port 8000 is in use: `netstat -ano | findstr :8000`
4. Try: `docker-compose restart backend`

---

### Problem: Integration tests fail to import httpx

**Error:** `ModuleNotFoundError: No module named 'httpx'`

**Solution:**
```powershell
python -m pip install httpx
python tests/test_integration.py
```

---

### Problem: Frontend won't load

**Error:** `http://localhost:3000` shows connection error

**Solution:**
```powershell
# Check if frontend is running
docker ps | findstr node

# If not showing, start manually:
cd "d:\personal projects 2\Rent Finding System\Rent Scout"
npm install
npm run dev
```

---

### Problem: n8n only shows 1 workflow

**Solution:** Import the missing workflows manually:
1. Go to http://localhost:5678
2. Click "Workflows" tab
3. Click "+" to create new
4. Click "Actions" → "Import from file"
5. Navigate to: `backend/n8n-workflows/`
6. Select the missing workflow JSON file
7. Click "Import"

---

### Problem: Listings page shows no data

**Status:** This is normal! The system uses mock data by default.

**To get real data:**
1. Add API credentials to `.env` (see Step 8)
2. Restart backend: `docker-compose restart backend`
3. Create a listing via API or test
4. Data will appear in UI

**OR manually create test data:**
```powershell
curl -X POST http://localhost:8000/api/listings `
  -H "Content-Type: application/json" `
  -d '{
    "title": "Beautiful Apartment",
    "price": 1500,
    "source": "test",
    "ai_score": 85
  }'
```

---

## Quick Reference Commands

```powershell
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs postgres
docker-compose logs n8n

# Restart services
docker-compose restart
docker-compose restart backend

# Stop all services
docker-compose down

# Remove all data and restart fresh
docker-compose down -v
docker-compose up -d

# Run verification script
python verify_implementation.py

# Run integration tests
python backend/tests/test_integration.py

# Access database
docker exec -it rentscout-postgres-1 psql -U rentscout -d rentscout_db

# View running containers
docker ps

# Follow live logs
docker-compose logs -f backend
```

---

## URLs to Access Everything

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Browse listings, apply filters |
| **Listings Page** | http://localhost:3000/listings | Main feature to test |
| **Backend API** | http://localhost:8000/docs | Interactive API documentation |
| **API Health** | http://localhost:8000/api/health | Check backend status |
| **n8n Workflows** | http://localhost:5678 | Automation workflows |
| **Database** | localhost:5432 | PostgreSQL (use psql to connect) |

---

## Next Steps After Verification

### ✅ If Everything Works:

1. **Add Real API Credentials** (Optional)
   - Follow Step 8 above
   - Use real Facebook or WhatsApp APIs
   - See actual rental listings

2. **Customize for Your Needs**
   - Edit filters in listings page
   - Add more scraper sources
   - Modify n8n workflows
   - Update database schema

3. **Deploy to Production**
   - Follow DEPLOYMENT.md guide
   - Set up SSL/TLS
   - Configure domain
   - Add secrets management

### ❌ If Something Doesn't Work:

1. Check the troubleshooting section above
2. Review logs: `docker-compose logs service-name`
3. Make sure all prerequisites are installed
4. Try restarting everything: `docker-compose down && docker-compose up -d`

---

## Support Files

**Read these for more details:**

- **COMPLETION_SUMMARY.md** - Overview of what was built
- **CREDENTIALS_SETUP.md** - How to add real API credentials
- **README.md** - Project overview
- **QUICKSTART.md** - Quick start guide
- **DEPLOYMENT.md** - How to deploy to production

---

## Final Check

**Run this to verify everything one more time:**

```powershell
# All services running?
docker-compose ps

# Code implementations verified?
python verify_implementation.py

# All tests passing?
python backend/tests/test_integration.py

# Frontend accessible?
curl http://localhost:3000/listings

# API working?
curl http://localhost:8000/docs
```

✅ **If all commands above work without errors, you're all set!**

---

**Need help?** Check the specific troubleshooting section above for your issue.

**Have questions?** Review the error message carefully - Docker usually gives helpful hints about what's wrong.

**Good luck!** 🚀
