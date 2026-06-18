# Rent Scout API Reference

Base URL: `http://localhost:8000/api`

## Authentication

### POST `/auth/register`
Create a new user account

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### POST `/auth/login`
Authenticate user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Same as register

### POST `/auth/refresh`
Refresh access token

**Request:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:**
```json
{
  "access_token": "new_token",
  "token_type": "bearer"
}
```

---

## Users

### GET `/users/me`
Get current user info

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": null,
  "created_at": "2024-01-15T10:00:00Z"
}
```

### PUT `/users/me`
Update user profile

**Request:**
```json
{
  "full_name": "Jane Doe",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

### GET `/users/profile`
Get user preferences

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "min_budget": 1000,
  "max_budget": 3000,
  "city": "San Francisco",
  "search_radius_km": 5,
  "unit_types": ["1BD", "2BD"],
  "neighborhoods": ["Downtown", "Marina"],
  "preferred_sources": ["zillow", "apartments"],
  "notification_email": true,
  "notification_sms": false
}
```

### POST `/users/profile/onboarding`
Initial preference setup

**Request:**
```json
{
  "city": "San Francisco",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "search_radius_km": 5,
  "unit_types": ["1BD", "2BD"],
  "neighborhoods": ["Downtown"],
  "preferred_sources": ["zillow"],
  "min_budget": 1000,
  "max_budget": 3000,
  "notification_email": true,
  "notification_phone": "+1-555-0123"
}
```

### PUT `/users/profile`
Update preferences

**Request:** Same as onboarding (partial updates accepted)

---

## AI Agents

### POST `/agents`
Create new AI agent

**Request:**
```json
{
  "name": "Downtown Scanner",
  "description": "Scans downtown SF for 2BR apartments",
  "agent_type": "scanner",
  "source": "multiple",
  "configuration": {
    "cities": ["San Francisco"],
    "max_pages": 2,
    "filters": {
      "min_price": 1000,
      "max_price": 3000
    }
  }
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Downtown Scanner",
  "agent_type": "scanner",
  "status": "active",
  "n8n_workflow_id": "abc123",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### GET `/agents`
List all user agents

**Response:**
```json
[
  {
    "id": 1,
    "name": "Downtown Scanner",
    "agent_type": "scanner",
    "status": "active",
    "last_run": "2024-01-15T09:00:00Z",
    "next_run": "2024-01-15T15:00:00Z"
  }
]
```

### GET `/agents/{agent_id}`
Get agent details

### PUT `/agents/{agent_id}`
Update agent configuration

**Request:**
```json
{
  "configuration": {
    "max_pages": 3
  }
}
```

### POST `/agents/{agent_id}/run-now`
Trigger agent immediately

**Response:**
```json
{
  "message": "Agent triggered",
  "activity_id": 100,
  "status": "queued"
}
```

### POST `/agents/{agent_id}/pause`
Pause agent execution

### POST `/agents/{agent_id}/resume`
Resume agent execution

### DELETE `/agents/{agent_id}`
Delete agent and n8n workflow

### GET `/agents/{agent_id}/activities`
Get agent activity history

**Query Parameters:**
- `limit`: 20 (default)
- `offset`: 0 (default)

**Response:**
```json
{
  "total": 50,
  "limit": 20,
  "offset": 0,
  "activities": [
    {
      "id": 100,
      "agent_id": 1,
      "activity_type": "scan",
      "status": "completed",
      "listings_processed": 45,
      "scams_detected": 3,
      "started_at": "2024-01-15T09:00:00Z",
      "completed_at": "2024-01-15T09:15:00Z"
    }
  ]
}
```

---

## Automation Rules

### POST `/rules`
Create automation rule

**Request:**
```json
{
  "name": "Budget Alert",
  "description": "Notify on deals under $2000",
  "conditions": {
    "price_max": 2000,
    "ai_score_min": 70,
    "scam_risk_max": 30
  },
  "actions": {
    "notify_channels": ["email", "sms"],
    "save_listing": true,
    "webhook_url": null
  }
}
```

### GET `/rules`
List user rules

### GET `/rules/{rule_id}`
Get rule details

### PUT `/rules/{rule_id}`
Update rule

### POST `/rules/{rule_id}/activate`
Enable rule

### POST `/rules/{rule_id}/deactivate`
Disable rule

### DELETE `/rules/{rule_id}`
Delete rule

### GET `/rules/{rule_id}/activity`
Get rule trigger history

---

## Notifications

### GET `/notifications`
List notifications

**Query Parameters:**
- `type`: all | deal | scam | system
- `is_read`: all | true | false

### GET `/notifications/{notification_id}`
Get notification details

### PUT `/notifications/{notification_id}/read`
Mark as read

### PUT `/notifications/{notification_id}/unread`
Mark as unread

### POST `/notifications/mark-all-read`
Mark all notifications as read

### DELETE `/notifications/{notification_id}`
Delete notification

### POST `/notifications/delete-all-read`
Delete all read notifications

### GET `/notifications/unread-count`
Get unread notification count

**Response:**
```json
{
  "unread_count": 5
}
```

---

## Web Scrapers

### POST `/scrapers/zillow`
Scrape Zillow listings

**Request:**
```json
{
  "city": "San Francisco",
  "max_pages": 2
}
```

**Response:**
```json
{
  "success": true,
  "source": "zillow",
  "count": 12,
  "listings": [
    {
      "listing_id": "zillow_12345",
      "title": "2BR Downtown Apartment",
      "price": 2500,
      "address": "123 Main St, San Francisco, CA",
      "beds": 2,
      "baths": 1,
      "sqft": 950,
      "image_url": "https://...",
      "url": "https://zillow.com/...",
      "description": "..."
    }
  ]
}
```

### POST `/scrapers/apartments`
Scrape Apartments.com

**Request:** Same as Zillow

### POST `/scrapers/craigslist`
Scrape Craigslist

**Request:** Same as Zillow

### POST `/scrapers/facebook`
Scrape Facebook Marketplace

**Request:**
```json
{
  "city": "San Francisco",
  "keywords": ["rental", "apartment"]
}
```

### POST `/scrapers/whatsapp-groups`
Search WhatsApp groups

**Request:**
```json
{
  "keywords": ["rental", "apartment"],
  "search_terms": ["2BR", "downtown"],
  "days_back": 7
}
```

### POST `/scrapers/listings/batch`
Store multiple listings

**Request:**
```json
{
  "agent_id": 1,
  "listings": [
    {
      "listing_id": "unique_id",
      "title": "Apartment",
      "price": 1500,
      "source": "zillow",
      "url": "https://...",
      "image_url": "https://...",
      "address": "123 Main St"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "total_listings": 12,
  "saved_count": 10,
  "duplicates_skipped": 2
}
```

---

## Evaluators

### POST `/evaluators/location`
Evaluate location score

**Request:**
```json
{
  "address": "123 Main St, San Francisco, CA",
  "user_preferences": {
    "city": "San Francisco",
    "neighborhoods": ["Downtown", "Marina"],
    "search_radius_km": 5
  }
}
```

**Response:**
```json
{
  "location_score": 85,
  "neighborhood_score": 95,
  "commute_score": 75,
  "in_target_city": true,
  "in_preferred_neighborhood": true
}
```

### POST `/evaluators/amenities`
Evaluate amenities

**Request:**
```json
{
  "beds": 2,
  "baths": 1,
  "sqft": 950,
  "amenities": ["parking", "gym", "pool"]
}
```

**Response:**
```json
{
  "bedroom_score": 67,
  "bathroom_score": 50,
  "space_score": 105,
  "amenities_score": 85,
  "total_amenities_score": 78
}
```

### POST `/evaluators/price-value`
Evaluate price-to-value ratio

**Request:**
```json
{
  "price": 2000,
  "beds": 2,
  "baths": 1,
  "sqft": 950,
  "user_budget": {
    "min": 1500,
    "max": 3000
  }
}
```

**Response:**
```json
{
  "price": 2000,
  "budget_score": 90,
  "value_score": 85,
  "price_per_sqft": 2.11,
  "market_comparison": "at market",
  "price_per_bedroom": 1000,
  "final_price_value_score": 88
}
```

### POST `/evaluators/comprehensive`
Full property evaluation

**Request:** Combines location, amenities, and price data

**Response:**
```json
{
  "final_ai_score": 82,
  "location": {...},
  "amenities": {...},
  "price_value": {...},
  "recommendation": "⭐⭐⭐⭐ Great option"
}
```

---

## Validators

### POST `/validators/address`
Validate address

**Request:**
```json
{
  "address": "123 Main St, San Francisco, CA"
}
```

**Response:**
```json
{
  "address": "123 Main St, San Francisco, CA",
  "is_valid": true,
  "is_residential": true,
  "geocoded": {
    "address": "123 Main St, San Francisco, CA",
    "lat": 37.7749,
    "lng": -122.4194,
    "country": "US"
  },
  "confidence": 0.95
}
```

### GET `/validators/reputation`
Check source reputation

**Query Parameters:**
- `source`: zillow | apartments | craigslist | facebook_marketplace | whatsapp_groups

**Response:**
```json
{
  "source": "zillow",
  "avg_rating": 4.2,
  "reported_count": 5,
  "verified": true,
  "risk_level": "low"
}
```

### POST `/validators/listing/ai-score`
Calculate AI score

**Request:**
```json
{
  "price": 2000,
  "beds": 2,
  "baths": 1,
  "sqft": 950,
  "location_score": 85
}
```

**Response:**
```json
{
  "ai_score": 82,
  "value_score": 85,
  "space_score": 105,
  "bedrooms_score": 67,
  "price_per_sqft": 2.11,
  "market_comparison": "at market"
}
```

### POST `/validators/listing/scam-patterns`
Detect scam patterns

**Request:**
```json
{
  "title": "Cheap Apartment",
  "description": "Wire transfer only, hurry up!"
}
```

**Response:**
```json
{
  "detected_patterns": {
    "payment_scams": ["wire\\s*transfer"],
    "urgency_scams": ["hurry"]
  },
  "pattern_count": 2,
  "risk_score": 30,
  "is_high_risk": false
}
```

---

## Webhooks

### POST `/webhooks/agent-activity`
n8n callback - Agent activity completion

**Request from n8n:**
```json
{
  "agent_id": 1,
  "activity_id": 100,
  "status": "completed",
  "listings_processed": 45,
  "scams_detected": 3,
  "error_log": null
}
```

### POST `/webhooks/rule-trigger`
n8n callback - Rule triggered

**Request from n8n:**
```json
{
  "rule_id": 1,
  "listings_matched": 5,
  "actions_executed": {"email_sent": true, "listing_saved": true}
}
```

### POST `/webhooks/listing-evaluated`
n8n callback - Listing evaluated

**Request from n8n:**
```json
{
  "listing_id": 1,
  "user_id": 1,
  "ai_score": 82,
  "scam_risk": 15,
  "evaluation_details": {...}
}
```

### GET `/webhooks/health`
Webhook service health

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Authentication Header Format

All protected endpoints require:
```
Authorization: Bearer {access_token}
```

### Getting Tokens

1. Register or login to get initial tokens
2. Store tokens in localStorage (frontend)
3. Include Authorization header in all requests
4. Refresh token when access token expires

---

## Rate Limiting

- **Auth endpoints**: 5 requests/minute
- **Scraper endpoints**: 10 requests/minute
- **Other endpoints**: 100 requests/minute

---

## Pagination

For list endpoints, use:
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Starting position (default: 0)

**Example:**
```
GET /agents?limit=10&offset=20
```

---

## Filtering

Some endpoints support filtering:
```
GET /notifications?type=scam&is_read=false
```

---

## Sorting

Add `sort` parameter:
```
GET /agents?sort=-created_at
```

- Use `-` prefix for descending order
- Common fields: created_at, updated_at, name, status

---

## Timestamps

All timestamps are ISO 8601 format with UTC timezone:
```
"2024-01-15T10:30:45Z"
```

---

## API Documentation

Interactive Swagger UI available at:
```
http://localhost:8000/docs
```

Alternative documentation (ReDoc):
```
http://localhost:8000/redoc
```
