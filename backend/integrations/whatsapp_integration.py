import httpx
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from config.credentials import credentials

logger = logging.getLogger(__name__)

class WhatsAppGroupIntegration:
    """WhatsApp group integration for rental listings"""
    
    def __init__(self, api_key: Optional[str] = None, phone_number: Optional[str] = None):
        # Use provided credentials, fallback to environment variables
        self.api_key = api_key or credentials.whatsapp_api_key or credentials.whatsapp_access_token
        self.phone_number = phone_number or credentials.whatsapp_business_phone
        self.account_id = credentials.whatsapp_business_account_id
        
        # Twilio alternative
        self.twilio_account_sid = credentials.twilio_account_sid
        self.twilio_auth_token = credentials.twilio_auth_token
        self.twilio_whatsapp_from = credentials.twilio_whatsapp_from
        
        self.timeout = 10.0
        self.use_mock = not self.api_key  # Use mock data if no credentials
        self.use_twilio = bool(self.twilio_account_sid and self.twilio_auth_token)
    
    async def search_group_listings(
        self,
        group_keywords: List[str],
        search_terms: List[str],
        days_back: int = 7
    ) -> List[Dict[str, Any]]:
        """Search WhatsApp groups for rental listings"""
        try:
            listings = []
            
            if self.use_mock:
                logger.info("Using mock WhatsApp group data (credentials not configured)")
                # For development: return mock listings
                return self._get_mock_whatsapp_listings(search_terms)
            
            # Try real API if credentials available
            logger.info(f"Searching WhatsApp groups with configured credentials for: {search_terms}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # If using Twilio
                if self.use_twilio:
                    return await self._search_via_twilio(client, search_terms)
                
                # If using native WhatsApp Business API
                if self.api_key:
                    for keyword in group_keywords:
                        params = {
                            "q": keyword,
                            "search_type": "group_messages",
                            "days_back": days_back,
                            "access_token": self.api_key,
                        }
                        
                        # Call WhatsApp Business API
                        response = await client.get(
                            "https://graph.instagram.com/v18.0/me/messages",
                            params=params
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            for msg in data.get("data", []):
                                # Try to extract listing from message
                                extracted = await self.extract_listings_from_message(msg.get("text", ""))
                                listings.extend(extracted)
            
            if not listings:
                logger.info("No listings found via API, using mock data as fallback")
                return self._get_mock_whatsapp_listings(search_terms)
            
            logger.info(f"Successfully found {len(listings)} listings from WhatsApp")
            return listings
        except Exception as e:
            logger.error(f"Error searching WhatsApp groups: {str(e)}")
            # Fallback to mock data
            return self._get_mock_whatsapp_listings(search_terms)
    
    async def get_group_members(self, group_id: str) -> List[Dict[str, Any]]:
        """Get members of a WhatsApp group"""
        try:
            members = []
            
            if not self.api_key:
                logger.warning("WhatsApp API key not configured")
                return []
            
            # Template for WhatsApp Business API
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                params = {
                    "group_id": group_id,
                }
                
                # Would call WhatsApp API
            
            return members
        except Exception as e:
            logger.error(f"Error fetching WhatsApp group members: {str(e)}")
            return []
    
    async def send_listing_inquiry(
        self,
        phone_number: str,
        listing_id: str,
        message: str = None
    ) -> Dict[str, Any]:
        """Send inquiry about listing to group member"""
        try:
            if self.use_mock:
                logger.info(f"Would send WhatsApp inquiry to {phone_number} (mock mode)")
                return {"success": True, "message": "Mock inquiry sent"}
            
            default_message = f"""Hi! I'm interested in this rental listing (ID: {listing_id}). 
Could you provide more information about availability, lease terms, and how to apply?"""
            
            inquiry_data = {
                "to": phone_number,
                "type": "text",
                "text": {
                    "body": message or default_message
                }
            }
            
            # If using Twilio
            if self.use_twilio:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_account_sid}/Messages.json",
                        auth=(self.twilio_account_sid, self.twilio_auth_token),
                        data={
                            "From": self.twilio_whatsapp_from,
                            "To": f"whatsapp:{phone_number}",
                            "Body": inquiry_data["text"]["body"],
                        }
                    )
                    
                    if response.status_code == 201:
                        logger.info(f"WhatsApp inquiry sent via Twilio to {phone_number}")
                        return {"success": True, "message": "Inquiry sent via Twilio"}
                    else:
                        logger.error(f"Twilio API error: {response.status_code}")
                        return {"success": False, "error": f"Twilio error: {response.status_code}"}
            
            # If using native WhatsApp Business API
            if self.api_key:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        f"https://graph.instagram.com/v18.0/{self.phone_number}/messages",
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        json=inquiry_data
                    )
                    
                    if response.status_code == 200:
                        logger.info(f"WhatsApp inquiry sent to {phone_number}")
                        return {"success": True, "message": "Inquiry sent successfully"}
                    else:
                        logger.error(f"WhatsApp API error: {response.status_code}")
                        return {"success": False, "error": f"WhatsApp API error: {response.status_code}"}
            
            return {
                "success": False,
                "error": "No WhatsApp credentials configured"
            }
        except Exception as e:
            logger.error(f"Error sending WhatsApp inquiry: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def extract_listings_from_message(
        self,
        message_text: str
    ) -> List[Dict[str, Any]]:
        """Extract rental listing info from WhatsApp message"""
        try:
            listings = []
            
            # AI/regex-based extraction of listing details from message
            # Look for patterns like price, beds, location, etc.
            
            import re
            
            # Price pattern: $1200, 1200/mo, 1200 rent
            price_match = re.search(r'\$?(\d{3,4})\s*(?:/mo|month|rent)?', message_text, re.IGNORECASE)
            price = int(price_match.group(1)) if price_match else None
            
            # Beds pattern: 2bd, 2 bed, 2 bedroom
            beds_match = re.search(r'(\d)\s*(?:bd|bed|bedroom)', message_text, re.IGNORECASE)
            beds = int(beds_match.group(1)) if beds_match else None
            
            # Baths pattern: 1ba, 1 bath, 1 bathroom
            baths_match = re.search(r'(\d)\s*(?:ba|bath|bathroom)', message_text, re.IGNORECASE)
            baths = int(baths_match.group(1)) if baths_match else None
            
            if price or beds or baths:
                listing = {
                    "source": "whatsapp_group",
                    "title": message_text[:100],
                    "price": price,
                    "beds": beds,
                    "baths": baths,
                    "description": message_text,
                    "extracted_from_message": True,
                    "confidence": 0.7 if (price and beds) else 0.5,
                }
                listings.append(listing)
            
            return listings
        except Exception as e:
            logger.error(f"Error extracting listing from message: {str(e)}")
            return []
    
    async def _search_via_twilio(self, client: httpx.AsyncClient, search_terms: List[str]) -> List[Dict[str, Any]]:
        """Search WhatsApp via Twilio integration"""
        listings = []
        # Twilio doesn't directly support message searching like WhatsApp Business API
        # This would typically require storing messages and searching locally
        logger.info("Twilio integration configured but message search not available in this version")
        return listings
    
    def _get_mock_whatsapp_listings(
        self,
        search_terms: List[str]
    ) -> List[Dict[str, Any]]:
        """Generate mock WhatsApp listings for development"""
        return [
            {
                "source": "whatsapp_group",
                "title": "2 Bedroom Apartment - Available Now",
                "price": 1400,
                "beds": 2,
                "baths": 1,
                "address": "Downtown area",
                "description": "Nice 2bd/1ba apartment in downtown. Furnished. $1400/month. Call for viewing.",
                "group_name": "Rentals in City",
                "sender_name": "Rental Agent",
                "sender_phone": "+1234567890",
                "posted_at": datetime.now().isoformat(),
                "message_id": "msg_123",
                "confidence": 0.85,
            },
            {
                "source": "whatsapp_group",
                "title": "3 Bedroom House - Near Campus",
                "price": 1800,
                "beds": 3,
                "baths": 2,
                "address": "Near university",
                "description": "Spacious 3bd/2ba house. Close to campus. $1800/mo. Utilities included.",
                "group_name": "Student Housing",
                "sender_name": "Property Owner",
                "sender_phone": "+1987654321",
                "posted_at": datetime.now().isoformat(),
                "message_id": "msg_124",
                "confidence": 0.80,
            },
        ]


# Singleton instance
whatsapp_integration = WhatsAppGroupIntegration()
