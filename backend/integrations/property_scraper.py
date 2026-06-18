import os
import json
import httpx
from typing import List, Dict, Any
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import logging

logger = logging.getLogger(__name__)

class PropertyScraper:
    """Web scraper for rental properties"""
    
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        self.timeout = 10.0
    
    async def scrape_zillow(self, city: str, max_pages: int = 3) -> List[Dict[str, Any]]:
        """Scrape Zillow for rental listings"""
        try:
            listings = []
            base_url = f"https://www.zillow.com/homes/for_rent/"
            
            async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
                for page in range(max_pages):
                    params = {
                        "searchQueryState": json.dumps({
                            "pagination": {"currentPage": page + 1},
                            "usersSearchTerm": city,
                            "mapBounds": None,
                            "filterState": {
                                "price": {"min": 0, "max": 10000},
                                "beds": {"min": 0},
                                "baths": {"min": 0},
                                "sqft": {"min": 0},
                                "lot": {"min": 0},
                                "type": {"townhome": True, "condo": True, "apartment": True, "house": True}
                            }
                        })
                    }
                    
                    response = await client.get(base_url, params=params)
                    if response.status_code != 200:
                        logger.warning(f"Failed to scrape Zillow page {page + 1}")
                        continue
                    
                    # Parse JSON response (Zillow returns JSON in script tags)
                    soup = BeautifulSoup(response.text, 'html.parser')
                    scripts = soup.find_all('script', type='application/json')
                    
                    for script in scripts:
                        try:
                            data = json.loads(script.string)
                            if "searchResults" in data:
                                results = data["searchResults"].get("listResults", [])
                                for result in results:
                                    listing = {
                                        "source": "zillow",
                                        "title": result.get("addressStreet", ""),
                                        "price": result.get("price", 0),
                                        "address": f"{result.get('addressStreet')} {result.get('addressCity')}",
                                        "beds": result.get("beds", 0),
                                        "baths": result.get("baths", 0),
                                        "sqft": result.get("area", 0),
                                        "image_url": result.get("imgSrc", ""),
                                        "url": f"https://www.zillow.com{result.get('url', '')}",
                                        "description": result.get("statusText", ""),
                                        "listing_id": result.get("id", ""),
                                    }
                                    listings.append(listing)
                        except json.JSONDecodeError:
                            continue
            
            return listings
        except Exception as e:
            logger.error(f"Error scraping Zillow: {str(e)}")
            return []
    
    async def scrape_apartments_com(self, city: str, max_pages: int = 3) -> List[Dict[str, Any]]:
        """Scrape Apartments.com for rental listings"""
        try:
            listings = []
            base_url = f"https://www.apartments.com/{city}/"
            
            async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
                for page in range(max_pages):
                    url = base_url if page == 0 else f"{base_url}?p={page + 1}"
                    
                    response = await client.get(url)
                    if response.status_code != 200:
                        continue
                    
                    soup = BeautifulSoup(response.text, 'html.parser')
                    listing_cards = soup.find_all('article', class_='js-placardContainer')
                    
                    for card in listing_cards:
                        try:
                            title_elem = card.find('a', class_='placard-title')
                            price_elem = card.find('span', class_='price')
                            bedsbaths = card.find('span', class_='bedsbaths')
                            sqft_elem = card.find('span', class_='sqft')
                            
                            listing = {
                                "source": "apartments",
                                "title": title_elem.text.strip() if title_elem else "",
                                "price": int(''.join(filter(str.isdigit, price_elem.text))) if price_elem else 0,
                                "url": urljoin(base_url, title_elem['href']) if title_elem else "",
                                "bedsbaths": bedsbaths.text.strip() if bedsbaths else "",
                                "sqft": sqft_elem.text.strip() if sqft_elem else "",
                                "address": title_elem.text.strip() if title_elem else "",
                            }
                            listings.append(listing)
                        except Exception as e:
                            logger.debug(f"Error parsing apartment listing: {str(e)}")
                            continue
            
            return listings
        except Exception as e:
            logger.error(f"Error scraping Apartments.com: {str(e)}")
            return []
    
    async def scrape_craigslist(self, city: str, max_pages: int = 3) -> List[Dict[str, Any]]:
        """Scrape Craigslist for rental listings"""
        try:
            listings = []
            # Craigslist city abbreviations
            city_abbr = self._get_craigslist_abbr(city)
            base_url = f"https://{city_abbr}.craigslist.org/search/apt"
            
            async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
                for page in range(max_pages):
                    offset = page * 120
                    params = {"s": offset}
                    
                    response = await client.get(base_url, params=params)
                    if response.status_code != 200:
                        continue
                    
                    soup = BeautifulSoup(response.text, 'html.parser')
                    listings_html = soup.find_all('div', class_='result-row')
                    
                    for item in listings_html:
                        try:
                            title_elem = item.find('a', class_='result-title')
                            price_span = item.find('span', class_='result-price')
                            meta = item.find('span', class_='result-meta')
                            
                            if title_elem and price_span:
                                listing = {
                                    "source": "craigslist",
                                    "title": title_elem.text.strip(),
                                    "price": int(''.join(filter(str.isdigit, price_span.text))),
                                    "url": title_elem['href'],
                                    "location": meta.text.strip() if meta else "",
                                    "posting_id": item.get('data-pid', ''),
                                }
                                listings.append(listing)
                        except Exception as e:
                            logger.debug(f"Error parsing Craigslist listing: {str(e)}")
                            continue
            
            return listings
        except Exception as e:
            logger.error(f"Error scraping Craigslist: {str(e)}")
            return []
    
    def _get_craigslist_abbr(self, city: str) -> str:
        """Map city names to Craigslist abbreviations"""
        city_map = {
            "san francisco": "sfbay",
            "new york": "newyork",
            "los angeles": "losangeles",
            "chicago": "chicago",
            "boston": "boston",
            "seattle": "seattle",
            "denver": "denver",
            "austin": "austin",
            "miami": "miami",
            "phoenix": "phoenix",
        }
        return city_map.get(city.lower(), city.lower().replace(" ", ""))


# Singleton instance
property_scraper = PropertyScraper()
