import httpx
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from config.credentials import credentials

logger = logging.getLogger(__name__)

class FacebookMarketplaceIntegration:
    """Facebook Marketplace integration for rental listings"""
    
    def __init__(self, access_token: Optional[str] = None):
        # Use provided token, fallback to credentials from .env
        self.access_token = access_token or credentials.facebook_access_token
        self.app_id = credentials.facebook_app_id
        self.app_secret = credentials.facebook_app_secret
        self.business_account_id = credentials.facebook_business_account_id
        self.graph_url = "https://graph.facebook.com/v18.0"
        self.timeout = 10.0
        self.use_mock = not self.access_token  # Use mock data if no credentials
    
    async def search_listings(
        self,
        query: str,
        category: str = "rentals",
        location: str = None,
        filters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Search Facebook Marketplace for listings"""
        try:
            # Note: Facebook Marketplace API access requires special permissions
            # This is a template for when you have proper API access
            
            listings = []
            
            if not self.access_token:
                logger.warning("Facebook access token not configured")
                # Return mock data for development
                return self._get_mock_marketplace_listings(query, location)
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                params = {
                    "q": query,
                    "type": "page",
                    "fields": "id,name,category,picture,link",
                    "access_token": self.access_token,
                }
                
                response = await client.get(
                    f"{self.graph_url}/search",
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    for item in data.get("data", []):
                        listing = {
                            "source": "facebook_marketplace",
                            "title": item.get("name", ""),
                            "url": item.get("link", ""),
                            "image_url": item.get("picture", {}).get("data", {}).get("url", ""),
                            "facebook_id": item.get("id", ""),
                            "category": item.get("category", ""),
                        }
                        listings.append(listing)
                else:
                    logger.error(f"Facebook API error: {response.status_code}")
            
            return listings
        except Exception as e:
            logger.error(f"Error searching Facebook Marketplace: {str(e)}")
            return []
    
    async def get_marketplace_groups(self) -> List[Dict[str, Any]]:
        """Get user's joined Facebook Marketplace groups"""
        try:
            groups = []
            
            if not self.access_token:
                logger.warning("Facebook access token not configured")
                return []
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                params = {
                    "fields": "id,name,privacy,owner,icon",
                    "access_token": self.access_token,
                }
                
                response = await client.get(
                    f"{self.graph_url}/me/groups",
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    for group in data.get("data", []):
                        group_info = {
                            "facebook_group_id": group.get("id", ""),
                            "name": group.get("name", ""),
                            "privacy": group.get("privacy", ""),
                            "icon": group.get("icon", ""),
                        }
                        groups.append(group_info)
            
            return groups
        except Exception as e:
            logger.error(f"Error fetching Facebook groups: {str(e)}")
            return []
    
    async def scrape_marketplace_posts(
        self,
        group_id: str = None,
        keywords: List[str] = None,
        max_posts: int = 50
    ) -> List[Dict[str, Any]]:
        """Scrape marketplace posts from groups"""
        try:
            posts = []
            
            if self.use_mock:
                logger.info("Using mock Facebook Marketplace data (credentials not configured)")
                # For development: return mock posts
                return self._get_mock_marketplace_posts(keywords, max_posts)
            
            # Try to fetch real posts if credentials available
            logger.info(f"Fetching real Facebook Marketplace posts with configured credentials")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Get posts from specific group or all marketplace items
                endpoint = f"{self.graph_url}/{group_id}/feed" if group_id else f"{self.graph_url}/me/marketplace_items"
                
                params = {
                    "fields": "id,message,name,description,price,updated_time,permalink_url,picture",
                    "access_token": self.access_token,
                    "limit": max_posts,
                }
                
                if keywords:
                    params["q"] = " ".join(keywords)
                
                response = await client.get(endpoint, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    for item in data.get("data", []):
                        # Parse price from message if present
                        price = item.get("price", 0)
                        if not price and item.get("message"):
                            # Try to extract price from message (e.g., "$1500/month")
                            import re
                            price_match = re.search(r'\$(\d+)', item.get("message", ""))
                            if price_match:
                                price = int(price_match.group(1))
                        
                        post = {
                            "source": "facebook_marketplace",
                            "title": item.get("name", item.get("message", "Untitled")[:50]),
                            "description": item.get("message", ""),
                            "price": price,
                            "url": item.get("permalink_url", ""),
                            "image_url": item.get("picture", ""),
                            "facebook_id": item.get("id", ""),
                            "posted_at": item.get("updated_time", datetime.now().isoformat()),
                        }
                        posts.append(post)
                    
                    logger.info(f"Successfully fetched {len(posts)} real Facebook Marketplace posts")
                else:
                    logger.error(f"Facebook API error: {response.status_code} - {response.text}")
                    # Fallback to mock data on API error
                    return self._get_mock_marketplace_posts(keywords, max_posts)
            
            return posts
        except Exception as e:
            logger.error(f"Error scraping marketplace posts: {str(e)}")
            # Fallback to mock data on exception
            return self._get_mock_marketplace_posts(keywords, max_posts)
    
    def _get_mock_marketplace_listings(
        self,
        query: str,
        location: str
    ) -> List[Dict[str, Any]]:
        """Generate mock listings for development"""
        return [
            {
                "source": "facebook_marketplace",
                "title": f"2BD/1BA Apartment - {location}",
                "price": 1500,
                "address": f"123 Main St, {location}",
                "beds": 2,
                "baths": 1,
                "url": "https://facebook.com/marketplace/item/123456",
                "image_url": "",
                "facebook_id": "123456",
                "posted_at": datetime.now().isoformat(),
                "seller_name": "John Doe",
                "seller_rating": 4.8,
            },
            {
                "source": "facebook_marketplace",
                "title": f"3BD/2BA House - {location}",
                "price": 2200,
                "address": f"456 Oak Ave, {location}",
                "beds": 3,
                "baths": 2,
                "url": "https://facebook.com/marketplace/item/654321",
                "image_url": "",
                "facebook_id": "654321",
                "posted_at": datetime.now().isoformat(),
                "seller_name": "Jane Smith",
                "seller_rating": 4.9,
            },
        ]
    
    def _get_mock_marketplace_posts(
        self,
        keywords: List[str],
        max_posts: int
    ) -> List[Dict[str, Any]]:
        """Generate mock marketplace posts for development"""
        posts = []
        for i in range(min(max_posts, 10)):
            posts.append({
                "source": "facebook_marketplace",
                "title": f"Rental Listing #{i+1}",
                "price": 1200 + (i * 200),
                "description": "Spacious apartment in great neighborhood",
                "post_id": f"post_{i}",
                "group_id": "group_123",
                "posted_at": datetime.now().isoformat(),
                "post_url": f"https://facebook.com/marketplace/post/item_{i}",
            })
        return posts


# Singleton instance
fb_integration = FacebookMarketplaceIntegration()
