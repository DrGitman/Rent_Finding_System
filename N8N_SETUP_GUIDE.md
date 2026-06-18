# Rent Scout n8n Workflow Setup Guide

## Overview

This guide explains how to set up n8n workflows for the Rent Scout rental property AI system. The workflows automate:
- Rental listing discovery from multiple sources
- Property evaluation and scoring
- Scam detection and risk assessment

## Architecture

```
User Preferences → Automation Rules → n8n Workflows → Backend APIs → Database
                                    ↓
                              Property Scrapers
                              AI Evaluators
                              Scam Detectors
```

## Prerequisites

1. **n8n Running**: `http://localhost:5678`
2. **Backend API Running**: `http://localhost:8000`
3. **Database**: PostgreSQL with migrations applied
4. **Python packages**: `beautifulsoup4`, `httpx`, `playwright` (for advanced scraping)

## Workflow 1: Rental Listing Scanner

**Purpose**: Scans multiple rental sources and aggregates listings

### Setup Steps

1. **Access n8n**
   - Open `http://localhost:5678`
   - Create a new workflow

2. **Import Workflow**
   - Copy content from `n8n-workflows/listing-scanner-workflow.json`
   - Paste into n8n (File → Import)
   - OR manually create nodes as follows:

3. **Node Configuration**

   **Webhook Trigger** (Trigger)
   - Method: POST
   - Path: `/webhook/rental-scanner`
   - Expected payload:
     ```json
     {
       "city": "San Francisco",
       "agent_id": 1,
       "activity_id": 100
     }
     ```

   **Scan Zillow** (HTTP Request)
   - Method: POST
   - URL: `http://localhost:8000/api/scrapers/zillow`
   - Body: `{"city": "San Francisco", "max_pages": 2}`

   **Scan Apartments.com** (HTTP Request)
   - Method: POST
   - URL: `http://localhost:8000/api/scrapers/apartments`

   **Scan Craigslist** (HTTP Request)
   - Method: POST
   - URL: `http://localhost:8000/api/scrapers/craigslist`

   **Scan Facebook Marketplace** (HTTP Request)
   - Method: POST
   - URL: `http://localhost:8000/api/scrapers/facebook`

   **Combine Results** (Code)
   - Merges all listings from different sources

   **Filter Duplicates** (Code)
   - Removes duplicate listings

   **Store Results** (HTTP Request)
   - POST to `http://localhost:8000/api/listings/batch`

4. **Test the Workflow**
   ```bash
   curl -X POST http://localhost:5678/webhook/rental-scanner \
     -H "Content-Type: application/json" \
     -d '{"city":"San Francisco","agent_id":1,"activity_id":100}'
   ```

### Triggers

This workflow can be triggered by:
- Manual execution from dashboard
- Webhook call from backend API
- Schedule (every 6 hours for example)

---

## Workflow 2: Property Evaluator

**Purpose**: Analyzes listings and assigns AI scores based on user preferences

### Setup Steps

1. **Create New Workflow**
   - Import from `n8n-workflows/property-evaluator-workflow.json`

2. **Node Configuration**

   **Webhook Trigger**
   - Path: `/webhook/property-evaluator`
   - Expected payload:
     ```json
     {
       "listing_id": 1,
       "user_id": 1,
       "price": 1500,
       "address": "123 Main St, San Francisco, CA"
     }
     ```

   **Get User Preferences** (HTTP Request)
   - GET: `http://localhost:8000/api/users/{user_id}/profile`

   **Evaluate Location** (HTTP Request)
   - POST: `http://localhost:8000/api/evaluators/location`

   **Calculate Price Score** (Code)
   - Scores listing based on user budget

   **Combine Scores** (Code)
   - Calculates final AI score (0-100)

   **Save Evaluation** (HTTP Request)
   - POST: `http://localhost:8000/api/listings/{listing_id}/evaluate`

3. **Enable Scheduled Evaluation**
   - Add Trigger: "On a schedule"
   - Cron: `0 */6 * * *` (every 6 hours)
   - Fetches unevaluated listings from database

### Scoring Formula

```
AI Score = (Price Score × 0.3) + 
           (Location Score × 0.25) + 
           (Amenities Score × 0.25) + 
           (Commute Score × 0.2)
```

**Score Breakdown:**
- **0-20**: Poor match
- **21-50**: Below average
- **51-75**: Good match
- **76-100**: Excellent match

---

## Workflow 3: Scam Detector

**Purpose**: Identifies suspicious/fraudulent listings using AI and heuristics

### Setup Steps

1. **Create New Workflow**
   - Import from `n8n-workflows/scam-detector-workflow.json`

2. **Node Configuration**

   **Webhook Trigger**
   - Path: `/webhook/scam-detector`
   - Expected payload:
     ```json
     {
       "listing_id": 1,
       "title": "2BR Apartment",
       "description": "Great apartment in downtown...",
       "price": 1500,
       "address": "123 Main St, SF"
     }
     ```

   **Check Red Flags** (Code)
   - Analyzes text for common scam indicators:
     - Suspiciously low price
     - Wire transfer only payment
     - No photos
     - Urgency language
     - Broken English
     - Generic descriptions

   **Verify Address** (HTTP Request)
   - POST: `http://localhost:8000/api/validators/address`

   **Check Owner Reputation** (HTTP Request)
   - GET: `http://localhost:8000/api/validators/reputation`

   **Combine Risk Assessment** (Code)
   - Calculates final scam risk (0-100)

   **Create Alert if Scam** (Condition)
   - If scam_risk > 70, sends alert

   **Send Scam Alert** (HTTP Request)
   - POST: `http://localhost:8000/api/notifications/scam-alert`

3. **Risk Scoring**

**Red Flags & Points:**
- Price below $300: +25
- Too good to be true language: +20
- Wire transfer only: +30
- No photos: +15
- Urgency language: +15
- Very short description: +10
- Suspicious language patterns: +10
- No calls/email only: +20
- Invalid address: +25
- Reputation score < 2.5: +15
- Multiple reports: +20

**Risk Categories:**
- **0-30**: Low risk (green)
- **31-60**: Medium risk (yellow)
- **61-100**: High risk - Likely scam (red)

---

## Data Flow Integration

### 1. Backend Triggers Workflow
```python
# In backend/core/n8n_client.py
await n8n_client.trigger_workflow(
    workflow_id="rental_scanner",
    data={
        "city": "San Francisco",
        "agent_id": 1,
        "activity_id": 100
    }
)
```

### 2. Workflow Calls Backend APIs
```
n8n → Backend Scrapers → Web Sources
n8n → Backend Evaluators → User Preferences
n8n → Backend Validators → Address/Reputation Data
```

### 3. Results Stored in Database
```
Workflow Results → Backend API → PostgreSQL Database
                ↓
          User Notifications
          Rule Triggers
          AI Agent Activity Logs
```

---

## Webhook Configuration

### Incoming Webhooks (From n8n)

Set up in backend `api/routers/webhooks.py`:

```python
@router.post("/agent-activity")
async def handle_agent_activity_webhook(payload: Dict):
    # Handle agent completion
    
@router.post("/listing-evaluated")
async def handle_listing_evaluated_webhook(payload: Dict):
    # Save evaluation results
```

### Outgoing Webhooks (To n8n)

Called from backend when agent is triggered:

```python
await n8n_client.trigger_workflow(
    workflow_id="rental_scanner",
    data=agent_trigger_data
)
```

---

## Web Scraping Implementation

### Supported Sources

| Source | Method | Status | API Required |
|--------|--------|--------|--------------|
| Zillow | HTTP | ✅ Implemented | ❌ No |
| Apartments.com | BeautifulSoup | ✅ Implemented | ❌ No |
| Craigslist | BeautifulSoup | ✅ Implemented | ❌ No |
| Facebook Marketplace | Graph API | 🔄 Mock | ✅ Yes (optional) |
| WhatsApp Groups | Business API | 🔄 Mock | ✅ Yes (optional) |

### Facebook Marketplace Integration

To enable real Facebook scraping:

1. **Get API Access**
   - Apply at [Facebook Developers](https://developers.facebook.com)
   - Create App with Marketplace permissions
   - Get `ACCESS_TOKEN`

2. **Configure in Backend**
   ```python
   # backend/.env
   FACEBOOK_ACCESS_TOKEN=your_token_here
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_secret
   ```

3. **Update Integration**
   ```python
   # backend/integrations/facebook_marketplace.py
   fb_integration = FacebookMarketplaceIntegration(
       access_token=settings.FACEBOOK_ACCESS_TOKEN
   )
   ```

### WhatsApp Integration

To enable WhatsApp group scraping:

1. **Get WhatsApp Business API Access**
   - Request at [WhatsApp Business Platform](https://www.whatsapp.com/business/api/)
   - Get `API_KEY` and verify phone number

2. **Configure in Backend**
   ```python
   # backend/.env
   WHATSAPP_API_KEY=your_key
   WHATSAPP_PHONE_NUMBER=+1234567890
   ```

3. **Update Integration**
   ```python
   whatsapp_integration = WhatsAppGroupIntegration(
       api_key=settings.WHATSAPP_API_KEY,
       phone_number=settings.WHATSAPP_PHONE_NUMBER
   )
   ```

---

## Testing Workflows

### Test Listing Scanner
```bash
curl -X POST http://localhost:5678/webhook/rental-scanner \
  -H "Content-Type: application/json" \
  -d '{
    "city": "San Francisco",
    "agent_id": 1,
    "activity_id": 100
  }'
```

### Test Property Evaluator
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

### Test Scam Detector
```bash
curl -X POST http://localhost:5678/webhook/scam-detector \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": 1,
    "title": "Apartment",
    "description": "Wire transfer only",
    "price": 500,
    "address": "123 Main St"
  }'
```

---

## Monitoring & Logs

### View Workflow Executions
1. Navigate to `http://localhost:5678`
2. Select workflow
3. Click "Executions" tab
4. View logs and debug

### Backend Logs
```bash
docker logs rentscout-backend
```

### Database Queries
```sql
-- Check agent activities
SELECT * FROM agent_activities ORDER BY created_at DESC LIMIT 10;

-- Check saved listings
SELECT * FROM saved_listings ORDER BY created_at DESC LIMIT 20;

-- Check notifications
SELECT * FROM notifications WHERE user_id = 1 ORDER BY created_at DESC;
```

---

## Troubleshooting

### Workflow Won't Execute
1. Check n8n status: `docker ps | grep n8n`
2. Verify webhook URL is correct
3. Check network connectivity: `curl http://localhost:5678/health`

### API Calls Failing
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check auth token in n8n
3. Review backend logs for errors

### Scrapers Not Finding Listings
1. Check website hasn't changed structure
2. Update CSS selectors in scraper
3. Verify network/proxy settings
4. Check for rate limiting (add delays)

### Scam Detection Too Sensitive
1. Adjust risk thresholds in workflow
2. Fine-tune red flag detection
3. Update reputation data

---

## Production Deployment

### Environment Variables
```bash
# .env
N8N_WEBHOOK_URL=https://n8n.rentscout.app/webhook
N8N_API_URL=https://n8n.rentscout.app/api/v1
API_TOKEN=production_jwt_token
FACEBOOK_ACCESS_TOKEN=prod_token
WHATSAPP_API_KEY=prod_key
```

### Scaling
- Run n8n in Docker cluster
- Use external PostgreSQL for n8n database
- Configure webhooks with HTTPS
- Implement rate limiting
- Add monitoring/alerting

---

## Next Steps

1. ✅ Import the three workflow JSON files
2. ✅ Configure webhooks and API endpoints
3. ✅ Test each workflow independently
4. ✅ Set up scheduling
5. ✅ Enable Facebook/WhatsApp integrations (optional)
6. ✅ Monitor workflow executions
7. ✅ Deploy to production

---

## Support

For issues or questions:
- Check n8n docs: https://docs.n8n.io/
- Backend API docs: http://localhost:8000/docs
- GitHub: [Rent Scout](https://github.com/yourusername/rent-scout)
