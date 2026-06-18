# 🚀 QUICK START - RUN IN 5 STEPS

## Step 1: Open PowerShell and Navigate

```powershell
cd "d:\personal projects 2\Rent Finding System\Rent Scout"
```

Copy and paste that command.

---

## Step 2: Start All Services (3 minutes)

```powershell
docker-compose up -d
```

**Wait for this output:**
```
[+] Running 4/4
 ✓ rentscout-postgres-1
 ✓ rentscout-redis-1
 ✓ rentscout-backend-1
 ✓ rentscout-n8n-1
```

**If Docker isn't running**, open Docker Desktop first, wait 30 seconds, then try again.

---

## Step 3: Verify Implementation (1 minute)

```powershell
python verify_implementation.py
```

**Should show:**
```
✓ PASS | Task 1: Frontend Listings UI
✓ PASS | Task 2: Integration Testing Script
✓ PASS | Task 3: API Credentials Support

Overall: 3/3 tasks verified
Status: ✓ ALL TASKS COMPLETE
```

---

## Step 4: Run All Tests (5 minutes)

```powershell
cd backend
python -m pip install httpx
python tests/test_integration.py
```

**Watch tests run and end with:**
```
======================================================================
  TEST SUMMARY
======================================================================
✓ Passed: 13
✗ Failed: 0
Total: 13
Success Rate: 100%
```

✅ **If you see 100%, everything works!**

---

## Step 5: View the System

Open these in your browser:

### 🏠 Listings Page
```
http://localhost:3000/listings
```
- See rental listings with filters
- Click "View Details" to see full property info
- Use filters on left: Source, Price, AI Score, Scam Risk
- Try sorting and pagination

### 🔌 API Documentation
```
http://localhost:8000/docs
```
- Interactive API documentation
- Can test endpoints directly
- Shows all available features

### 🤖 n8n Workflows
```
http://localhost:5678
```
- Login: `admin@rentscout.local` / `N8n@Rent2024`
- See 2 workflows for automation
- Click "Execute" to test them

### 🗄️ Database
```powershell
docker exec -it rentscout-postgres-1 psql -U rentscout -d rentscout_db
```

Then run:
```sql
SELECT COUNT(*) FROM saved_listing;
\q
```

---

## ✅ Done!

All 3 tasks are working:
1. ✅ Frontend Listings Page - Full UI with filtering, sorting, pagination
2. ✅ Integration Tests - 13 tests covering all features
3. ✅ API Credentials - Support for real Facebook/WhatsApp APIs (+ mock fallback)

---

## Issues?

**Services not starting?**
```powershell
docker-compose logs backend
```

**Tests won't run?**
```powershell
# Make sure httpx is installed
python -m pip install httpx --upgrade

# Then try again
python tests/test_integration.py
```

**Frontend won't load?**
```powershell
cd "d:\personal projects 2\Rent Finding System\Rent Scout"
npm install
npm run dev
```

**Need more help?** Read `RUNBOOK.md` for detailed troubleshooting.

---

## Summary of What Was Completed

### Task 1: Frontend Listings UI ✅
- Advanced filtering (source, price, score, risk)
- Sorting (8 options)
- Pagination with customizable page size
- Detail modal for full property info
- Responsive design
- Color-coded badges
- **File:** `app/listings/page.tsx` (487 lines)

### Task 2: Integration Tests ✅  
- 13 comprehensive tests
- Auth, scrapers, evaluators, validators, webhooks
- Full end-to-end workflow testing
- 100% pass rate when system is working
- **File:** `backend/tests/test_integration.py` (486 lines)

### Task 3: API Credentials ✅
- Credentials manager with environment variables
- Support for Facebook, WhatsApp, Twilio
- Automatic mock data fallback
- Comprehensive setup guide included
- **Files:** `backend/config/credentials.py`, `.env.example`, `CREDENTIALS_SETUP.md`

---

**Everything is ready to go! Start with Step 1.** 🚀
