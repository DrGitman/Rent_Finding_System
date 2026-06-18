# Rent Scout Implementation Guide

## System Overview

Rent Scout is an AI-powered rental property discovery and evaluation system with multi-source property scraping, intelligent scoring, and fraud detection powered by n8n workflows.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                            │
│  - Auth Pages, Onboarding, Dashboard, Agents, Listings          │
└────────────┬────────────────────────────────────────────────────┘
             │ HTTP API Calls
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend API (FastAPI + Python)                      │
│  - Auth Router (Register, Login, JWT)                           │
│  - Users Router (Profiles, Preferences)                         │
│  - Agents Router (CRUD + n8n Workflow Management)               │
│  - Rules Router (Automation Rules)                              │
│  - Scrapers Router (Web Scraping Endpoints)                     │
│  - Evaluators Router (Property Scoring)                         │
│  - Validators Router (Address, Reputation, Scam Detection)      │
│  - Webhooks Router (n8n Callback Handlers)                      │
└────────────┬────────────────────────────────────────────────────┘
             │ SQL Queries / REST Calls
             ▼
┌──────────────────────┬──────────────────┬──────────────────────┐
│  PostgreSQL Database │  n8n Workflows   │   External Services  │
│  - Users             │  - Scanner       │   - Zillow           │
│  - Listings          │  - Evaluator     │   - Apartments.com   │
│  - Agents            │  - Scam Detector │   - Craigslist       │
│  - Rules             │                  │   - Facebook MP       │
│  - Notifications     │                  │   - WhatsApp Groups   │
└──────────────────────┴──────────────────┴──────────────────────┘
```

---

## Phase 1: Environment Setup

### 1.1 Docker Compose Services

All services are defined in `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: 5432:5432
    
  redis:
    image: redis:7-alpine
    ports: 6379:6379
    
  n8n:
    image: n8n:latest
    ports: 5678:5678
    
  backend:
    build: ./backend
    ports: 8000:8000
    depends_on: [postgres, redis]
```

**Starting Services:**
```bash
docker-compose up -d
```

**Verify All Services:**
```bash
docker-compose ps
# Expected: All services should show "Up"
```

### 1.2 Database Setup

**Automatic Migrations:**
```bash
# Database migrations run automatically on backend startup
docker logs rentscout-backend | grep "Migration"
```

**Manual Schema Check:**
```bash
docker exec rentscout-postgres psql -U rentscout -d rentscout -c "\dt"
```

**Expected Tables:**
- users
- user_profiles
- ai_agents
- automation_rules
- saved_listings
- agent_activities
- notifications
- rule_activity_logs
- audit_logs

### 1.3 Backend Requirements

**Install Dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

**Required Packages Added:**
- `beautifulsoup4` - HTML parsing for web scraping
- `lxml` - XML/HTML processing
- `playwright` - Advanced web scraping (optional)

---

## Phase 2: Backend Implementation

### 2.1 Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── core/
│   ├── config.py          # Settings management
│   ├── database.py        # SQLAlchemy setup
│   ├── security.py        # JWT + Password hashing
│   └── n8n_client.py      # n8n integration
├── models/
│   └── models.py          # ORM models (10 tables)
├── schemas/
│   └── schemas.py         # Pydantic validation schemas
├── api/
│   └── routers/
│       ├── auth.py        # Authentication
│       ├── users.py       # User profiles
│       ├── agents.py      # AI agents CRUD
│       ├── rules.py       # Automation rules
│       ├── notifications.py
│       ├── webhooks.py    # n8n callbacks
│       ├── scrapers.py    # ✨ NEW - Scraping endpoints
│       ├── evaluators.py  # ✨ NEW - Property scoring
│       └── validators.py  # ✨ NEW - Validators
└── integrations/
    ├── property_scraper.py      # Web scrapers
    ├── facebook_marketplace.py  # FB integration
    └── whatsapp_integration.py  # WhatsApp integration
```

### 2.2 API Endpoints Summary

#### Authentication (`/api/auth`)
- `POST /register` - Create user account
- `POST /login` - Get JWT tokens
- `POST /refresh` - Refresh access token
- `POST /reset-password` - Password reset

#### Users (`/api/users`)
- `GET /me` - Current user info
- `PUT /me` - Update user
- `GET /profile` - User preferences
- `POST /profile/onboarding` - Initial setup
- `PUT /profile` - Update preferences

#### AI Agents (`/api/agents`)
- `POST /` - Create agent + n8n workflow
- `GET /` - List user's agents
- `GET /{id}` - Get single agent
- `PUT /{id}` - Update agent config
- `POST /{id}/run-now` - Trigger execution
- `POST /{id}/pause` - Pause agent
- `POST /{id}/resume` - Resume agent
- `DELETE /{id}` - Delete agent
- `GET /{id}/activities` - Activity history

#### Automation Rules (`/api/rules`)
- `POST /` - Create rule
- `GET /` - List rules
- `GET /{id}` - Get rule
- `PUT /{id}` - Update rule
- `POST /{id}/activate` - Enable rule
- `POST /{id}/deactivate` - Disable rule
- `DELETE /{id}` - Delete rule
- `GET /{id}/activity` - Trigger history

#### Notifications (`/api/notifications`)
- `GET /` - List notifications
- `GET /{id}` - Get notification
- `PUT /{id}/read` - Mark as read
- `DELETE /{id}` - Delete notification
- `POST /mark-all-read` - Bulk mark read
- `GET /unread-count` - Unread count

#### **Web Scrapers** (`/api/scrapers`) ✨ NEW
- `POST /zillow` - Scrape Zillow
- `POST /apartments` - Scrape Apartments.com
- `POST /craigslist` - Scrape Craigslist
- `POST /facebook` - Scrape Facebook Marketplace
- `POST /whatsapp-groups` - Search WhatsApp groups
- `POST /listings/batch` - Store listings

#### **Evaluators** (`/api/evaluators`) ✨ NEW
- `POST /location` - Evaluate location score
- `POST /amenities` - Evaluate amenities
- `POST /price-value` - Evaluate price-to-value
- `POST /comprehensive` - Full property evaluation

#### **Validators** (`/api/validators`) ✨ NEW
- `POST /address` - Validate address
- `GET /reputation` - Check source reputation
- `POST /listing/ai-score` - Calculate AI score
- `POST /listing/scam-patterns` - Detect scam patterns

#### Webhooks (`/api/webhooks`)
- `POST /agent-activity` - n8n callback
- `POST /rule-trigger` - Rule execution result
- `POST /listing-evaluated` - Evaluation result
- `GET /health` - Service health

### 2.3 Running the Backend

```bash
# From project root
cd backend

# Using Python directly
python main.py

# OR using Docker
docker-compose up -d rentscout-backend

# OR using Uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Health Check:**
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","services":[...]}
```

**API Documentation:**
Visit: `http://localhost:8000/docs` (Swagger UI)

---

## Phase 3: n8n Workflows

### 3.1 Workflow Files

Three JSON workflow files are provided:

1. **listing-scanner-workflow.json** (10 nodes)
   - Scans multiple rental sources
   - Aggregates listings
   - Removes duplicates
   - Stores results

2. **property-evaluator-workflow.json** (7 nodes)
   - Scores properties based on user preferences
   - Calculates AI score
   - Stores evaluation

3. **scam-detector-workflow.json** (9 nodes)
   - Detects fraud patterns
   - Checks address validity
   - Assesses owner reputation
   - Sends alerts

### 3.2 Importing Workflows

**Method 1: Manual UI Import**

1. Open n8n: `http://localhost:5678`
2. Click "New" → "Import workflow"
3. Select JSON file from `n8n-workflows/`
4. Rename and save

**Method 2: API Import**

```bash
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d @n8n-workflows/listing-scanner-workflow.json
```

**Method 3: Direct File Copy**

```bash
docker cp n8n-workflows/listing-scanner-workflow.json \
  rentscout-n8n:/root/.n8n/workflows/
```

### 3.3 Workflow Configuration

#### Listing Scanner Workflow

**Trigger:** Manual or Webhook
```
POST /webhook/rental-scanner
{
  "city": "San Francisco",
  "agent_id": 1,
  "activity_id": 100
}
```

**Nodes:**
1. Webhook Trigger - Receives POST request
2. Extract Parameters - Sets city, agent_id, activity_id
3. Scan Zillow - POST to /api/scrapers/zillow
4. Scan Apartments - POST to /api/scrapers/apartments
5. Scan Craigslist - POST to /api/scrapers/craigslist
6. Scan Facebook - POST to /api/scrapers/facebook
7. Combine Results - JavaScript: Merge all listings
8. Filter Duplicates - JavaScript: Remove duplicates
9. Store Results - POST to /api/listings/batch
10. Send Response - Return combined listings

**Data Flow:**
```
Webhook Input
    ↓
Extract Parameters (city, agent_id, activity_id)
    ↓
[Parallel] Scan 4 Sources
    ↓
Combine Results (merge arrays)
    ↓
Filter Duplicates (by price-address-source)
    ↓
Store in Database
    ↓
Return Response
```

#### Property Evaluator Workflow

**Trigger:** Webhook or Schedule
```
POST /webhook/property-evaluator
{
  "listing_id": 1,
  "user_id": 1,
  "price": 1500,
  "address": "123 Main St, SF"
}
```

**Nodes:**
1. Webhook Trigger
2. Extract Data
3. Get User Preferences - GET /api/users/{user_id}/profile
4. Evaluate Location - POST /api/evaluators/location
5. Calculate Price Score - JavaScript: Compare to budget
6. Combine Scores - JavaScript: Weighted average
7. Save Evaluation - POST /api/listings/{id}/evaluate

**Scoring Formula:**
```
AI Score = 
  (Location Score × 0.3) +
  (Price Score × 0.3) +
  (Amenities Score × 0.2) +
  (Commute Score × 0.2)
```

#### Scam Detector Workflow

**Trigger:** Webhook or Schedule
```
POST /webhook/scam-detector
{
  "listing_id": 1,
  "title": "2BR Apartment",
  "description": "...",
  "price": 1500,
  "address": "123 Main St"
}
```

**Nodes:**
1. Webhook Trigger
2. Extract Listing Data
3. Check Red Flags - JavaScript: Text analysis
4. Verify Address - POST /api/validators/address
5. Check Owner Reputation - GET /api/validators/reputation
6. Combine Risk Assessment - JavaScript: Calculate risk score
7. Save Scam Assessment - POST /api/listings/{id}/scam-check
8. Create Alert if Scam - Conditional (risk > 70)
9. Send Scam Alert - POST /api/notifications/scam-alert (if needed)

**Red Flag Detection:**
- Price < $300: +25 points
- Wire transfer only: +30 points
- No photos: +15 points
- Urgency language: +15 points
- Invalid address: +25 points
- Poor reputation: +15 points

**Risk Categories:**
- 0-30: Low (✅ Safe)
- 31-60: Medium (⚠️ Caution)
- 61-100: High (❌ Likely Scam)

### 3.4 Testing Workflows

**Test Scanner:**
```bash
curl -X POST http://localhost:5678/webhook/rental-scanner \
  -H "Content-Type: application/json" \
  -d '{
    "city": "San Francisco",
    "agent_id": 1,
    "activity_id": 100
  }'
```

**Test Evaluator:**
```bash
curl -X POST http://localhost:5678/webhook/property-evaluator \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": 1,
    "user_id": 1,
    "price": 1500,
    "address": "123 Main St, San Francisco"
  }'
```

**Test Scam Detector:**
```bash
curl -X POST http://localhost:5678/webhook/scam-detector \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": 1,
    "title": "Cheap Apartment",
    "description": "Wire transfer only, hurry",
    "price": 300,
    "address": "123 Main St"
  }'
```

---

## Phase 4: Frontend Implementation

### 4.1 Pages Implemented

#### `/auth/page.tsx` - Login
- Email/password form
- Error handling
- Redirect to onboarding

#### `/auth/signup/page.tsx` - Registration
- Full name, email, password
- Password strength validation
- Terms of service checkbox

#### `/auth/reset-password/page.tsx` - Password Reset
- 3-step form
- Email verification
- New password entry

#### `/onboarding/page.tsx` - User Preferences
- 5-step wizard
- Location, unit types, neighborhoods
- Budget, notification preferences
- Progress bar

#### `/agents/page.tsx` - AI Agents Dashboard
- List all user agents
- Create new agent dialog
- Run, pause, resume, delete actions
- Activity history modal

#### `/settings/page.tsx` (Optional)
- Profile editing
- Notification preferences
- Connected services

### 4.2 Frontend API Integration

All calls go to `http://localhost:8000/api/`

**Token Management:**
```typescript
// Store tokens in localStorage
localStorage.setItem('access_token', response.access_token)
localStorage.setItem('user_id', response.user.id)

// Include in requests
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
```

### 4.3 Running Frontend

```bash
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Development server
npm run dev
# or
pnpm dev

# Opens at http://localhost:3000
```

---

## Phase 5: Testing & Validation

### 5.1 Backend Testing

**Test All Routers:**
```bash
# Auth
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Scrapers
curl -X POST http://localhost:8000/api/scrapers/zillow \
  -H "Content-Type: application/json" \
  -d '{"city":"San Francisco","max_pages":1}'

# Evaluators
curl -X POST http://localhost:8000/api/evaluators/location \
  -H "Content-Type: application/json" \
  -d '{"address":"123 Main St, SF","user_preferences":{"city":"San Francisco"}}'

# Validators
curl -X POST http://localhost:8000/api/validators/address \
  -H "Content-Type: application/json" \
  -d '{"address":"123 Main St, San Francisco"}'
```

### 5.2 n8n Workflow Testing

1. Open `http://localhost:5678`
2. Select each workflow
3. Click "Manual Trigger" or use webhook test
4. Check execution logs
5. Verify results in backend logs

### 5.3 End-to-End Flow

1. **User Registration**
   ```bash
   POST /api/auth/register
   → User created
   → JWT tokens returned
   ```

2. **Onboarding**
   ```bash
   POST /api/users/profile/onboarding
   → Preferences saved
   → Ready to use agents
   ```

3. **Create Agent**
   ```bash
   POST /api/agents
   → Agent created in DB
   → n8n workflow created
   → Activation confirmation
   ```

4. **Trigger Agent**
   ```bash
   POST /api/agents/{id}/run-now
   → Webhook call to n8n
   → Workflow executes
   → Results callback to backend
   → Notifications sent
   ```

---

## Phase 6: Deployment

### 6.1 Docker Build

```bash
# Build all services
docker-compose build

# Push to registry
docker tag rentscout-backend:latest myregistry/rentscout-backend:v1.0
docker push myregistry/rentscout-backend:v1.0
```

### 6.2 Environment Variables

Create `.env` file:
```
# Backend
DATABASE_URL=postgresql://user:pass@postgres:5432/rentscout
SECRET_KEY=your_secret_key_here
N8N_WEBHOOK_URL=https://n8n.rentscout.app/webhook
REDIS_URL=redis://redis:6379

# External APIs
FACEBOOK_ACCESS_TOKEN=your_token
WHATSAPP_API_KEY=your_key
GOOGLE_MAPS_API_KEY=your_key

# SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@rentscout.app
SMTP_PASSWORD=your_password
```

### 6.3 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rentscout-backend
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: backend
        image: myregistry/rentscout-backend:v1.0
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: rentscout-secrets
              key: database-url
```

---

## Phase 7: Production Checklist

- [ ] All 3 workflows imported and tested
- [ ] Backend health check passing
- [ ] Database migrations applied
- [ ] CORS configured for production domain
- [ ] JWT secrets updated
- [ ] Facebook/WhatsApp API credentials configured
- [ ] Email notifications enabled (SMTP)
- [ ] Redis caching working
- [ ] Logging configured
- [ ] Monitoring/alerting set up
- [ ] SSL certificates installed
- [ ] Rate limiting enabled
- [ ] Database backups scheduled
- [ ] n8n backups scheduled

---

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose logs rentscout-backend

# Restart service
docker-compose restart rentscout-backend

# Recreate containers
docker-compose down && docker-compose up -d
```

### Workflow Not Executing
1. Verify n8n is running: `http://localhost:5678`
2. Check webhook URL is correct
3. Review n8n execution logs
4. Test with curl manually

### API Returning 500 Errors
1. Check backend logs
2. Verify database connection
3. Test specific endpoint manually
4. Check for missing environment variables

### Database Migration Issues
```bash
# Check migration status
docker exec rentscout-backend alembic current

# Run pending migrations
docker exec rentscout-backend alembic upgrade head

# Reset database (careful!)
docker exec rentscout-postgres dropdb rentscout
docker exec rentscout-postgres createdb rentscout
```

---

## Next Steps

1. ✅ Import n8n workflows
2. ✅ Start backend service
3. ✅ Verify all API endpoints
4. ✅ Test each workflow
5. ✅ Run frontend
6. ✅ Complete end-to-end testing
7. ✅ Add real API credentials (Facebook, WhatsApp)
8. ✅ Deploy to production

---

## Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **n8n Docs**: https://docs.n8n.io/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **Next.js Docs**: https://nextjs.org/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## Support

For issues or questions, refer to:
- Backend logs: `docker logs rentscout-backend`
- n8n logs: `docker logs rentscout-n8n`
- Database logs: `docker logs rentscout-postgres`
- API docs: `http://localhost:8000/docs`
- n8n UI: `http://localhost:5678`
