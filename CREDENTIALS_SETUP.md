# Setting Up API Credentials for Rent Finding System

This guide explains how to configure real API credentials for property scraping sources. The system falls back to mock data when credentials aren't provided, making it safe to run in development mode.

## Quick Start

1. **Copy the template file:**
   ```bash
   cd "d:\personal projects 2\Rent Finding System\Rent Scout"
   cp .env.example .env
   ```

2. **Add your credentials to `.env`** (follow the sections below)

3. **Restart the backend service:**
   ```bash
   docker-compose restart backend
   ```

---

## Facebook Marketplace Integration

### Prerequisites
- Facebook Business Account
- Facebook App (created in Facebook Developer Console)
- Proper permissions: `pages_read_user_content`, `user_groups`, `marketplace_management`

### Setup Steps

#### Step 1: Create a Facebook App
1. Go to https://developers.facebook.com/apps
2. Click "Create App" → Choose "Business"
3. Give it a name (e.g., "Rent Scout")
4. Accept terms and create

#### Step 2: Get App Credentials
1. In your app dashboard, find **Settings → Basic**
2. Copy your **App ID** and **App Secret**
3. Add to `.env`:
   ```
   FACEBOOK_APP_ID=your-app-id-here
   FACEBOOK_APP_SECRET=your-app-secret-here
   ```

#### Step 3: Generate Access Token
1. Go to **Tools → Access Token Debugger** or use Graph API Explorer
2. Create a user access token with these permissions:
   - `pages_read_user_content`
   - `user_groups`
   - `marketplace_management`
3. Add to `.env`:
   ```
   FACEBOOK_ACCESS_TOKEN=your-long-lived-access-token
   ```

#### Step 4: Get Business Account ID
1. Visit https://business.facebook.com/settings
2. Go to **Business Settings → Business Info**
3. Copy your **Business Account ID**
4. Add to `.env`:
   ```
   FACEBOOK_BUSINESS_ACCOUNT_ID=your-business-account-id
   ```

### Testing Facebook Integration
```bash
curl -X POST http://localhost:8000/api/scrapers/facebook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"city": "Austin, TX", "max_pages": 1}'
```

**Note:** Facebook Marketplace API access is limited. For production, consider applying for official API access through Facebook's approval process.

---

## WhatsApp Integration

You can use **either** the native WhatsApp Business API **or** Twilio (recommended for easier setup).

### Option A: WhatsApp Business API (Direct)

#### Prerequisites
- WhatsApp Business Account
- Approved WhatsApp Business API access
- Phone number verified for business use

#### Setup Steps

1. **Get WhatsApp Access Token:**
   - Go to https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
   - Complete the verification process
   - Generate a permanent access token from your app settings

2. **Add to `.env`:**
   ```
   WHATSAPP_ACCESS_TOKEN=your-permanent-access-token
   WHATSAPP_BUSINESS_PHONE=+1234567890  # Your verified business number
   WHATSAPP_BUSINESS_ACCOUNT_ID=your-account-id
   ```

### Option B: Twilio WhatsApp Integration (Recommended ✅)

Twilio provides an easier-to-set-up alternative with similar functionality.

#### Prerequisites
- Twilio Account (free trial available at https://www.twilio.com)
- Verified WhatsApp number
- $0.005+ account balance (tiny amount)

#### Setup Steps

1. **Create Twilio Account:**
   - Go to https://www.twilio.com/console
   - Sign up (free trial: $15 credit)
   - Verify your phone number

2. **Enable WhatsApp:**
   - In Twilio Console, go to **Messaging → Try it Out → Send an SMS**
   - Look for "WhatsApp" section
   - Follow the setup wizard to enable WhatsApp sandbox
   - You'll get a **sandbox number** like `whatsapp:+1234567890`

3. **Get Credentials:**
   - Go to **Account → API keys & tokens**
   - Copy your **Account SID** and **Auth Token**
   - Get your WhatsApp sandbox number from messaging settings

4. **Add to `.env`:**
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your-auth-token-here
   TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
   ```

### Testing WhatsApp Integration
```bash
curl -X POST http://localhost:8000/api/scrapers/whatsapp-groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"group_ids": ["123456789"], "limit": 10}'
```

---

## Other Property Sources

### Zillow
```
ZILLOW_API_KEY=your-api-key
```
- Get key from: https://www.zillow.com/howto/api/

### Apartments.com
```
APARTMENTS_API_KEY=your-api-key
```
- Get key from: https://developers.apartments.com/

### Craigslist Proxy (for scraping without IP blocking)
```
CRAIGSLIST_PROXY_URL=http://proxy.example.com:8080
```

---

## Verification of Credentials

### Check Credential Status
```bash
curl http://localhost:8000/api/health/credentials \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Returns:
```json
{
  "facebook": {
    "configured": true,
    "app_id": true,
    "access_token": true
  },
  "whatsapp": {
    "configured": true,
    "api_key": false,
    "twilio": true,
    "access_token": true
  }
}
```

### Running Integration Tests
```bash
cd backend
python tests/test_integration.py
```

This runs 13 comprehensive tests including:
- User authentication
- All 5 scraper sources (Zillow, Apartments, Craigslist, Facebook, WhatsApp)
- Listing management (CRUD, filtering)
- Property evaluation (location, amenities)
- Scam detection
- Webhook callbacks

---

## Troubleshooting

### "Facebook access token not configured"
- ✅ System is working fine! Mock data will be used for development
- To use real API: Add `FACEBOOK_ACCESS_TOKEN` to `.env`

### "WhatsApp credentials not configured"
- ✅ System is working fine! Mock data will be used for development
- To use real API: Add `WHATSAPP_ACCESS_TOKEN` or Twilio credentials to `.env`

### API Request Returns 401 Unauthorized
- Check that your token is still valid (tokens may expire)
- For Facebook: Use Graph API debugger to check token status
- For Twilio: Verify Account SID in console matches your `.env`

### Webhook Callbacks Not Received
- Ensure `WEBHOOK_BASE_URL` in `.env` is accessible to n8n
- Check n8n webhook settings in workflow configuration
- Verify backend service is running: `curl http://localhost:8000/api/health`

### Rate Limiting Errors
- Different APIs have different rate limits:
  - **Facebook**: ~200 requests/hour
  - **WhatsApp**: Depends on Twilio plan
  - **Zillow**: ~2,500 requests/day (free tier)
- Consider implementing request throttling for production

---

## Security Best Practices

⚠️ **IMPORTANT:**

1. **Never commit `.env` to Git**
   - `.env` is already in `.gitignore`
   - Always use `.env.example` as a template

2. **Keep tokens secret**
   - Don't share your `.env` file
   - Rotate tokens regularly
   - Use different tokens for dev/prod

3. **Use environment-specific credentials**
   - Development: Use sandbox/test credentials
   - Production: Use separate production tokens with limited permissions

4. **Enable token expiration**
   - Set tokens to expire after 90 days
   - Implement automatic token refresh

5. **Monitor API usage**
   - Check usage dashboards in each provider's console
   - Set up billing alerts
   - Implement rate limiting in your application

---

## Production Deployment

### Environment Variables for Production
```bash
# Use AWS Secrets Manager, Azure Key Vault, or similar
export FACEBOOK_ACCESS_TOKEN=$(aws secretsmanager get-secret-value --secret-id rent-scout/facebook-token)
export WHATSAPP_ACCESS_TOKEN=$(aws secretsmanager get-secret-value --secret-id rent-scout/whatsapp-token)
export TWILIO_AUTH_TOKEN=$(aws secretsmanager get-secret-value --secret-id rent-scout/twilio-token)
```

### Required Firewall Rules
- **Outbound 443 (HTTPS)** to: facebook.com, graph.facebook.com, twilio.com, zillow.com, apartments.com
- **Inbound 8000 (Backend API)** for webhook callbacks from n8n

---

## Support & Additional Resources

- **Facebook Developers:** https://developers.facebook.com/docs
- **WhatsApp Business API:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **Twilio Docs:** https://www.twilio.com/docs
- **API Rate Limits:** Check each provider's documentation

---

## Next Steps

1. ✅ Copy `.env.example` to `.env`
2. ✅ Add at least one credential (Facebook or Twilio)
3. ✅ Restart backend: `docker-compose restart backend`
4. ✅ Run integration tests: `python backend/tests/test_integration.py`
5. ✅ Visit http://localhost:3000/listings to see real data!

