# Rent Finding System (Rent Scout)

**AI-Powered Rental Property Discovery Platform**

An intelligent system for finding, evaluating, and managing rental listings from multiple sources with AI-powered scoring and automated scam detection.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the System](#running-the-system)
- [API Documentation](#api-documentation)
- [n8n Workflows](#n8n-workflows)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- Git

### Start Everything

```bash
# Clone repository
cd "D:\personal projects 2\Rent Finding System\Rent Scout"

# Start all services
docker-compose up -d

# Wait for services to be ready
# Check status: docker-compose ps
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **n8n Workflows**: http://localhost:5678

### Initial Setup

1. **Register** at http://localhost:3000/auth/signup
2. **Complete Onboarding** with your preferences
3. **Create Agents** from dashboard to start scanning properties
4. **View Listings** and their AI scores

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────┐
│      Frontend (Next.js + React)     │
│  Port: 3000                          │
└────────────────┬────────────────────┘
                 │ HTTP API
                 ▼
┌─────────────────────────────────────┐
│    Backend API (FastAPI + Python)   │
│  Port: 8000                          │
├─────────────────────────────────────┤
│ Routers:                             │
│ • Auth (JWT + bcrypt)               │
│ • Users (Profiles, Preferences)     │
│ • Agents (AI Agent Management)      │
│ • Rules (Automation Rules)          │
│ • Listings (CRUD + Scoring)         │
│ • Scrapers (Multi-source)           │
│ • Evaluators (AI Scoring)           │
│ • Validators (Address, Scam Check)  │
│ • Webhooks (n8n Callbacks)          │
└────────────────┬────────────────────┘
                 │
        ┌────────┼────────┐
        │        │        │
        ▼        ▼        ▼
    ┌───────────────────────────────┐
    │     PostgreSQL Database       │
    │     Port: 5432               │
    │                               │
    │ • users                       │
    │ • user_profiles              │
    │ • saved_listings             │
    │ • ai_agents                  │
    │ • automation_rules           │
    │ • agent_activities           │
    │ • notifications              │
    └───────────────────────────────┘
        │        │        │
        ▼        ▼        ▼
    ┌─────────────────────────────┐
    │    n8n Workflows            │
    │    Port: 5678               │
    ├─────────────────────────────┤
    │ • Rental Scanner            │
    │ • Property Evaluator        │
    │ • Scam Detector             │
    └─────────────────────────────┘
        │        │        │
        ▼        ▼        ▼
    ┌──────────────────────────────────┐
    │   External Data Sources          │
    ├──────────────────────────────────┤
    │ • Zillow (Web Scraping)          │
    │ • Apartments.com (BeautifulSoup) │
    │ • Craigslist (HTTP)              │
    │ • Facebook Marketplace (API)     │
    │ • WhatsApp Groups (API)          │
    └──────────────────────────────────┘
```

---

## 📁 Project Structure

```
Rent Finding System/
└── Rent Scout/                    # Main project folder
    ├── frontend/                  # Next.js Frontend
    │   ├── app/                   # Pages (auth, onboarding, agents, dashboard)
    │   ├── components/            # UI components
    │   ├── hooks/                 # Custom React hooks
    │   ├── lib/                   # Utilities
    │   ├── public/                # Static assets
    │   ├── package.json
    │   └── tsconfig.json
    ├── backend/                   # FastAPI Backend
    │   ├── main.py                # Application entry point
    │   ├── requirements.txt        # Python dependencies
    │   ├── core/
    │   │   ├── config.py          # Settings management
    │   │   ├── database.py        # SQLAlchemy setup
    │   │   ├── security.py        # JWT + password hashing
    │   │   └── n8n_client.py      # n8n integration
    │   ├── models/
    │   │   └── models.py          # SQLAlchemy ORM models (10 tables)
    │   ├── schemas/
    │   │   └── schemas.py         # Pydantic validation schemas
    │   ├── api/
    │   │   └── routers/
    │   │       ├── auth.py        # Authentication endpoints
    │   │       ├── users.py       # User management
    │   │       ├── agents.py      # AI agents CRUD
    │   │       ├── rules.py       # Automation rules
    │   │       ├── notifications.py
    │   │       ├── listings.py    # ✨ Listings management
    │   │       ├── scrapers.py    # ✨ Web scraping endpoints
    │   │       ├── evaluators.py  # ✨ AI scoring
    │   │       ├── validators.py  # ✨ Validators
    │   │       └── webhooks.py    # n8n callbacks
    │   └── integrations/
    │       ├── property_scraper.py      # Zillow, Apartments, Craigslist
    │       ├── facebook_marketplace.py  # Facebook scraping
    │       └── whatsapp_integration.py  # WhatsApp groups
    ├── n8n-workflows/             # n8n Workflow Definitions
    │   ├── listing-scanner-workflow.json       # Multi-source scraping
    │   ├── property-evaluator-workflow.json    # AI scoring
    │   └── scam-detector-workflow.json         # Fraud detection
    ├── docker-compose.yml         # Docker services configuration
    ├── README.md                  # This file
    ├── API_REFERENCE.md           # Complete API documentation
    ├── IMPLEMENTATION_GUIDE.md    # Implementation steps
    └── N8N_SETUP_GUIDE.md         # Workflow setup guide
```

---

## ✨ Features

### For Users

- **Multi-Source Property Discovery**
  - Scrapes Zillow, Apartments.com, Craigslist
  - Integrates with Facebook Marketplace
  - Searches WhatsApp rental groups
  - Deduplicates listings across sources

- **AI-Powered Evaluation**
  - Location scoring based on user preferences
  - Price-to-value analysis
  - Amenity evaluation
  - Composite AI score (0-100)

- **Intelligent Scam Detection**
  - Red flag detection (payment methods, language patterns)
  - Address validation
  - Owner reputation checking
  - Risk scoring (0-100)

- **Automation Rules**
  - Create custom rules (e.g., "Notify if deal < $2000")
  - Automatic notifications
  - Auto-save matching listings
  - Webhook triggers

- **Agent Management**
  - Create multiple AI agents
  - Scanner agents for discovery
  - Evaluator agents for scoring
  - Scam detector agents
  - View activity and history

### For Developers

- **FastAPI Backend**
  - RESTful API with comprehensive documentation
  - JWT authentication with refresh tokens
  - Role-based access control ready
  - Async/await support

- **n8n Workflow Integration**
  - Orchestrate complex property workflows
  - Webhook-based communication
  - Visual workflow builder
  - Easy to extend with new nodes

- **PostgreSQL Database**
  - Normalized schema (10 tables)
  - JSONB columns for flexible configuration
  - Full-text search ready
  - Audit logging ready

- **Docker Compose**
  - One-command deployment
  - All services configured
  - Health checks included
  - Volume persistence

---

## 📦 Installation

### 1. Prerequisites

```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone Project

```bash
# Navigate to the project
cd "D:\personal projects 2\Rent Finding System\Rent Scout"
```

### 3. Environment Configuration

Create `.env` file in project root:

```env
# Backend
DATABASE_URL=postgresql://rentscout:changeme_secure_password_123@postgres:5432/rentscout
SECRET_KEY=your_super_secret_key_change_this_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_API_URL=http://localhost:5678/api/v1
N8N_API_KEY=your_n8n_api_key

# Redis
REDIS_URL=redis://redis:6379

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# External APIs (optional)
FACEBOOK_ACCESS_TOKEN=your_token_here
WHATSAPP_API_KEY=your_key_here
GOOGLE_MAPS_API_KEY=your_key_here

# Email (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

---

## ⚙️ Configuration

### Backend Environment

Edit `backend/.env`:

```python
# Database
DATABASE_URL = "postgresql://user:pass@localhost/rentscout"

# Security
SECRET_KEY = "your-super-secret-key-min-32-chars"
ALGORITHM = "HS256"

# Token expiration
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# n8n Integration
N8N_WEBHOOK_URL = "http://localhost:5678/webhook"
N8N_API_URL = "http://localhost:5678/api/v1"

# CORS
ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:3001"]
```

### Frontend Environment

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development
```

---

## 🏃 Running the System

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart a service
docker-compose restart backend
```

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# or
pnpm install
pnpm dev
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# n8n health
curl http://localhost:5678/api/v1/executions

# Database connection
docker exec rentscout-postgres psql -U rentscout -d rentscout -c "SELECT 1"
```

---

## 📚 API Documentation

### Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Authenticate |
| `/api/users/profile` | GET/PUT | Manage preferences |
| `/api/agents` | GET/POST | AI agents CRUD |
| `/api/agents/{id}/run-now` | POST | Trigger agent |
| `/api/listings` | GET/POST | Listings CRUD |
| `/api/listings/{id}/evaluate` | POST | Update AI score |
| `/api/listings/{id}/scam-check` | POST | Scam assessment |
| `/api/rules` | GET/POST | Automation rules |
| `/api/notifications` | GET | View notifications |
| `/api/scrapers/zillow` | POST | Scrape Zillow |
| `/api/validators/address` | POST | Validate address |

**Full Reference**: See [API_REFERENCE.md](./API_REFERENCE.md)

---

## 🔄 n8n Workflows

### Three Main Workflows

1. **Rental Scanner** (10 nodes)
   - Scans multiple sources
   - Aggregates results
   - Removes duplicates
   - Stores listings

2. **Property Evaluator** (7 nodes)
   - Scores properties
   - Calculates AI score
   - Compares to user preferences
   - Stores evaluation

3. **Scam Detector** (9 nodes)
   - Detects red flags
   - Validates addresses
   - Checks owner reputation
   - Sends alerts if scam detected

### Importing Workflows

1. Open n8n: http://localhost:5678
2. Create new workflow
3. File → Import
4. Select JSON from `n8n-workflows/` folder
5. Activate workflow

**Detailed Guide**: See [N8N_SETUP_GUIDE.md](./N8N_SETUP_GUIDE.md)

---

## 💻 Development

### Backend Development

```bash
# Enter backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run with hot reload
python -m uvicorn main:app --reload

# Format code
black .

# Run linter
flake8 .

# Type checking
mypy .
```

### Frontend Development

```bash
# Enter frontend directory
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Development server with hot reload
npm run dev
# or
pnpm dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Add new column"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Update `.env` with production credentials
- [ ] Change `SECRET_KEY` to random 32+ character string
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure production database (external PostgreSQL)
- [ ] Set up Redis cache (external instance)
- [ ] Configure email service (SMTP)
- [ ] Add real Facebook/WhatsApp API credentials
- [ ] Set up monitoring and logging
- [ ] Configure backups
- [ ] Load test the system

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Run production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Kubernetes Deployment

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for Kubernetes setup.

---

## 🔧 Troubleshooting

### Services Won't Start

```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs rentscout-backend

# Restart service
docker-compose restart rentscout-backend

# Rebuild and restart
docker-compose up -d --build --force-recreate
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps postgres

# Test connection
docker exec rentscout-postgres psql -U rentscout -d rentscout -c "SELECT 1"

# View database logs
docker-compose logs postgres

# Reset database (CAREFUL!)
docker-compose down -v
docker-compose up -d
```

### API Errors

```bash
# Check backend logs
docker-compose logs -f rentscout-backend

# View API documentation
http://localhost:8000/docs

# Test health endpoint
curl http://localhost:8000/health
```

### n8n Workflow Issues

```bash
# Check n8n logs
docker-compose logs -f n8n

# Verify webhook configuration
curl http://localhost:5678/webhook/rental-scanner

# Test workflow manually
http://localhost:5678 → Open workflow → Manual Trigger
```

### Frontend Issues

```bash
# Clear Node modules and reinstall
rm -rf frontend/node_modules
npm install

# Clear Next.js cache
rm -rf frontend/.next

# Rebuild frontend
npm run build

# Check frontend logs
docker-compose logs -f rentscout-frontend
```

---

## 📊 Monitoring

### View Service Status

```bash
# All services
docker-compose ps

# Specific service logs
docker-compose logs -f rentscout-backend

# View last 100 lines
docker-compose logs --tail=100 rentscout-postgres
```

### Database Monitoring

```bash
# Connect to database
docker exec -it rentscout-postgres psql -U rentscout -d rentscout

# Common queries
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM saved_listings;
SELECT * FROM notifications WHERE user_id = 1;
```

### n8n Monitoring

- UI: http://localhost:5678
- Executions → View workflow runs
- Settings → Check configuration

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open pull request

### Code Style

- **Python**: Follow PEP 8, use Black for formatting
- **TypeScript**: Use Prettier, ESLint
- **SQL**: Use snake_case for identifiers

---

## 📄 License

[Your License Here]

---

## 📞 Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review [API_REFERENCE.md](./API_REFERENCE.md)
- See [N8N_SETUP_GUIDE.md](./N8N_SETUP_GUIDE.md) for workflows
- Consult [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

---

## 🗺️ Roadmap

### Phase 1: MVP (Complete ✅)
- ✅ Multi-source property scraping
- ✅ AI-powered evaluation
- ✅ Scam detection
- ✅ Automation rules
- ✅ Basic frontend

### Phase 2: Enhancement (In Progress)
- 🔄 Email notifications
- 🔄 Advanced filtering
- 🔄 Saved searches
- 🔄 User ratings

### Phase 3: Production
- ⏳ Mobile app
- ⏳ Analytics dashboard
- ⏳ Advanced ML models
- ⏳ Team collaboration

---

## 🎯 Next Steps

1. **Start Docker**: `docker-compose up -d`
2. **Register User**: http://localhost:3000/auth/signup
3. **Complete Onboarding**: Set preferences
4. **Create Agent**: Start with scanner
5. **View Results**: Dashboard shows listings
6. **Refine Rules**: Create automation rules

---

**Happy house hunting! 🏠**
