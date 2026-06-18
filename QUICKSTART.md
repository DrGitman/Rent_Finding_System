# Quick Start Guide

**Get Rent Scout running in 5 minutes**

---

## Step 1: Start All Services

```bash
cd "D:\personal projects 2\Rent Finding System\Rent Scout"
docker-compose up -d
```

Wait 30 seconds for services to initialize.

---

## Step 2: Verify Services Are Running

```bash
docker-compose ps
```

You should see:
- ✅ rentscout-postgres (PostgreSQL)
- ✅ rentscout-redis (Redis)
- ✅ rentscout-n8n (n8n Workflows)
- ✅ rentscout-backend (FastAPI Backend)
- ✅ rentscout-frontend (Next.js Frontend)

---

## Step 3: Open the Application

Click links to open in browser:

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **n8n Workflows**: http://localhost:5678

---

## Step 4: Register & Login

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Create account with email and password
4. Complete 5-step onboarding

---

## Step 5: Create Your First Agent

1. Go to Agents dashboard
2. Click "New Agent"
3. Choose type: **Scanner**
4. Set configuration and click "Create"
5. Agent starts scanning automatically

---

## Step 6: View Results

1. Go to Listings page
2. See properties from multiple sources
3. Check AI scores and scam risk
4. Save your favorites

---

## Useful Commands

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f n8n
docker-compose logs -f postgres
```

### Stop All Services
```bash
docker-compose down
```

### Restart a Service
```bash
docker-compose restart backend
```

### Access Database
```bash
docker exec -it rentscout-postgres psql -U rentscout -d rentscout
```

### Check API Health
```bash
curl http://localhost:8000/health
```

---

## Documentation

- **Full README**: [README.md](./README.md)
- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)
- **n8n Setup**: [N8N_SETUP_GUIDE.md](./N8N_SETUP_GUIDE.md)
- **Implementation**: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

---

## Troubleshooting

### Services won't start
```bash
docker-compose down
docker-compose up -d --build
```

### Can't access frontend
- Check port 3000: http://localhost:3000
- Check backend is running: http://localhost:8000/health
- Check logs: `docker-compose logs frontend`

### Database issues
```bash
docker-compose restart postgres
docker-compose logs postgres
```

### n8n issues
```bash
# View n8n logs
docker-compose logs n8n

# Check n8n status
curl http://localhost:5678/api/v1/executions
```

---

## Default Credentials

- **Database**: 
  - User: `rentscout`
  - Password: `changeme_secure_password_123` (change in production!)

---

## Next Steps

1. ✅ Setup complete
2. 📋 Create automation rules for personalized alerts
3. 🔍 Import n8n workflows for advanced automation
4. 🏠 Save listings and track your favorites
5. 📊 Monitor AI scores and scam detections

---

**Questions?** Check the documentation files or review API docs at http://localhost:8000/docs
