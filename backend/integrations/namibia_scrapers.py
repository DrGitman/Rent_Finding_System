"""
Namibia-specific property scrapers for:
  - property24.co.na
  - propertynews.com.na
  - myproperty.com.na
  - rightmovepropertieswindhoek.com
"""

import re
import logging
from typing import List, Dict, Any

import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlencode

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-ZA,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}
TIMEOUT = 20.0


def _parse_price(text: str) -> int:
    """Extract an integer NAD/ZAR price from a price string like 'N$7 500 p/m'."""
    digits = re.sub(r"[^\d]", "", text or "")
    return int(digits) if digits else 0


# ─── Property24 Namibia ──────────────────────────────────────────────────────

async def scrape_property24(city: str = "windhoek", max_pages: int = 3) -> List[Dict[str, Any]]:
    """Scrape rental listings from property24.co.na."""
    listings: List[Dict[str, Any]] = []
    slug = city.lower().replace(" ", "-")
    base_url = f"https://www.property24.co.na/to-rent/{slug}/p"

    async with httpx.AsyncClient(headers=HEADERS, timeout=TIMEOUT, follow_redirects=True) as client:
        for page in range(1, max_pages + 1):
            url = f"{base_url}{page}"
            try:
                resp = await client.get(url)
                if resp.status_code != 200:
                    logger.warning("property24 page %d → %d", page, resp.status_code)
                    break

                soup = BeautifulSoup(resp.text, "html.parser")
                cards = soup.select("div.p24_regularTile, div.js_listingResultItem")

                if not cards:
                    break

                for card in cards:
                    try:
                        title_el = card.select_one("span.p24_streetAddress, p.p24_address")
                        price_el = card.select_one("span.p24_price")
                        link_el = card.select_one("a[href]")
                        img_el = card.select_one("img")
                        beds_el = card.select_one("span.p24_featureDetails[title*='Bedroom'], li.p24_feature[title*='Bedroom']")
                        baths_el = card.select_one("span.p24_featureDetails[title*='Bathroom'], li.p24_feature[title*='Bathroom']")

                        href = link_el["href"] if link_el else ""
                        full_url = urljoin("https://www.property24.co.na", href)
                        listing_id = re.search(r"/(\d+)$", href)

                        listings.append({
                            "source": "property24_na",
                            "listing_id": listing_id.group(1) if listing_id else href,
                            "title": title_el.get_text(strip=True) if title_el else "",
                            "price": _parse_price(price_el.get_text() if price_el else ""),
                            "url": full_url,
                            "image_url": img_el.get("src", "") if img_el else "",
                            "beds": int(re.search(r"\d+", beds_el.get_text()).group()) if beds_el and re.search(r"\d+", beds_el.get_text()) else 0,
                            "baths": int(re.search(r"\d+", baths_el.get_text()).group()) if baths_el and re.search(r"\d+", baths_el.get_text()) else 0,
                            "city": city,
                        })
                    except Exception as exc:
                        logger.debug("property24 card error: %s", exc)
            except Exception as exc:
                logger.error("property24 page %d error: %s", page, exc)
                break

    logger.info("property24: found %d listings in %s", len(listings), city)
    return listings


# ─── Property News Namibia ────────────────────────────────────────────────────

async def scrape_propertynews(city: str = "windhoek", max_pages: int = 3) -> List[Dict[str, Any]]:
    """Scrape rental listings from propertynews.com.na."""
    listings: List[Dict[str, Any]] = []
    slug = city.lower().replace(" ", "+")

    async with httpx.AsyncClient(headers=HEADERS, timeout=TIMEOUT, follow_redirects=True) as client:
        for page in range(1, max_pages + 1):
            params = {
                "search": slug,
                "listing_type": "to-let",
                "page": page,
            }
            url = f"https://www.propertynews.com.na/properties/to-let?{urlencode(params)}"
            try:
                resp = await client.get(url)
                if resp.status_code != 200:
                    logger.warning("propertynews page %d → %d", page, resp.status_code)
                    break

                soup = BeautifulSoup(resp.text, "html.parser")
                cards = soup.select("div.listing-item, article.property-card, div.property-listing")

                if not cards:
                    # fallback: try generic card selectors
                    cards = soup.select("div[class*='listing'], div[class*='property']")

                if not cards:
                    break

                for card in cards:
                    try:
                        title_el = card.select_one("h2, h3, .listing-title, .property-title")
                        price_el = card.select_one(".price, .listing-price, [class*='price']")
                        link_el = card.select_one("a[href]")
                        img_el = card.select_one("img")

                        href = link_el["href"] if link_el else ""
                        full_url = urljoin("https://www.propertynews.com.na", href)
                        listing_id = re.sub(r"[^a-z0-9]", "-", href.lower())[:64]

                        listings.append({
                            "source": "propertynews_na",
                            "listing_id": listing_id,
                            "title": title_el.get_text(strip=True) if title_el else "",
                            "price": _parse_price(price_el.get_text() if price_el else ""),
                            "url": full_url,
                            "image_url": img_el.get("src", "") if img_el else "",
                            "city": city,
                        })
                    except Exception as exc:
                        logger.debug("propertynews card error: %s", exc)
            except Exception as exc:
                logger.error("propertynews page %d error: %s", page, exc)
                break

    logger.info("propertynews: found %d listings in %s", len(listings), city)
    return listings


# ─── MyProperty Namibia ───────────────────────────────────────────────────────

async def scrape_myproperty(city: str = "windhoek", max_pages: int = 3) -> List[Dict[str, Any]]:
    """Scrape rental listings from myproperty.com.na."""
    listings: List[Dict[str, Any]] = []
    slug = city.lower().replace(" ", "-")

    async with httpx.AsyncClient(headers=HEADERS, timeout=TIMEOUT, follow_redirects=True) as client:
        for page in range(1, max_pages + 1):
            url = f"https://www.myproperty.com.na/to-rent/{slug}/?page={page}"
            try:
                resp = await client.get(url)
                if resp.status_code != 200:
                    logger.warning("myproperty page %d → %d", page, resp.status_code)
                    break

                soup = BeautifulSoup(resp.text, "html.parser")
                # myproperty.com.na uses similar markup to property24
                cards = soup.select("div.listing-result, div[class*='property-result'], article")

                if not cards:
                    break

                for card in cards:
                    try:
                        title_el = card.select_one("h2, h3, .listing-title, [class*='address']")
                        price_el = card.select_one("[class*='price'], .amount")
                        link_el = card.select_one("a[href]")
                        img_el = card.select_one("img")
                        beds_el = card.select_one("[class*='bed'], [title*='bed' i]")
                        baths_el = card.select_one("[class*='bath'], [title*='bath' i]")

                        href = link_el["href"] if link_el else ""
                        full_url = urljoin("https://www.myproperty.com.na", href)
                        listing_id = re.search(r"/(\d+)", href)

                        beds_text = beds_el.get_text() if beds_el else "0"
                        baths_text = baths_el.get_text() if baths_el else "0"

                        listings.append({
                            "source": "myproperty_na",
                            "listing_id": listing_id.group(1) if listing_id else re.sub(r"[^a-z0-9]", "-", href.lower())[:64],
                            "title": title_el.get_text(strip=True) if title_el else "",
                            "price": _parse_price(price_el.get_text() if price_el else ""),
                            "url": full_url,
                            "image_url": img_el.get("src", "") if img_el else "",
                            "beds": int(re.search(r"\d+", beds_text).group()) if re.search(r"\d+", beds_text) else 0,
                            "baths": int(re.search(r"\d+", baths_text).group()) if re.search(r"\d+", baths_text) else 0,
                            "city": city,
                        })
                    except Exception as exc:
                        logger.debug("myproperty card error: %s", exc)
            except Exception as exc:
                logger.error("myproperty page %d error: %s", page, exc)
                break

    logger.info("myproperty: found %d listings in %s", len(listings), city)
    return listings


# ─── Right Move Properties Windhoek ──────────────────────────────────────────

async def scrape_rightmove_windhoek(max_pages: int = 3) -> List[Dict[str, Any]]:
    """Scrape rental listings from rightmovepropertieswindhoek.com."""
    listings: List[Dict[str, Any]] = []
    base_url = "https://www.rightmovepropertieswindhoek.com"

    async with httpx.AsyncClient(headers=HEADERS, timeout=TIMEOUT, follow_redirects=True) as client:
        for page in range(1, max_pages + 1):
            url = f"{base_url}/properties/to-rent" if page == 1 else f"{base_url}/properties/to-rent?page={page}"
            try:
                resp = await client.get(url)
                if resp.status_code != 200:
                    logger.warning("rightmove page %d → %d", page, resp.status_code)
                    break

                soup = BeautifulSoup(resp.text, "html.parser")
                # Try common WordPress/estate agency selectors
                cards = soup.select(
                    "div.property-item, article.property, div[class*='listing'], "
                    "div.estate-property, .property-listing-item"
                )

                if not cards:
                    # Broader fallback
                    cards = soup.select("article, div.item")

                if not cards:
                    break

                for card in cards:
                    try:
                        title_el = card.select_one("h2, h3, .property-title, .listing-title, [class*='title']")
                        price_el = card.select_one(".price, [class*='price'], .amount, .rent")
                        link_el = card.select_one("a[href]")
                        img_el = card.select_one("img")
                        beds_el = card.select_one("[class*='bed'], [class*='bedroom']")
                        baths_el = card.select_one("[class*='bath'], [class*='bathroom']")

                        href = link_el["href"] if link_el else ""
                        if href and not href.startswith("http"):
                            href = urljoin(base_url, href)

                        listing_id = re.search(r"/(\d+)", href) or re.search(r"[?&]id=(\d+)", href)
                        if not listing_id:
                            listing_id_str = re.sub(r"[^a-z0-9]", "-", href.lower())[-64:]
                        else:
                            listing_id_str = listing_id.group(1)

                        beds_text = beds_el.get_text() if beds_el else "0"
                        baths_text = baths_el.get_text() if baths_el else "0"

                        title = title_el.get_text(strip=True) if title_el else ""
                        # Skip navigation/footer links without real titles
                        if not title or len(title) < 4:
                            continue

                        listings.append({
                            "source": "rightmove_windhoek",
                            "listing_id": listing_id_str,
                            "title": title,
                            "price": _parse_price(price_el.get_text() if price_el else ""),
                            "url": href,
                            "image_url": img_el.get("src", "") if img_el else "",
                            "beds": int(re.search(r"\d+", beds_text).group()) if re.search(r"\d+", beds_text) else 0,
                            "baths": int(re.search(r"\d+", baths_text).group()) if re.search(r"\d+", baths_text) else 0,
                            "city": "windhoek",
                        })
                    except Exception as exc:
                        logger.debug("rightmove card error: %s", exc)
            except Exception as exc:
                logger.error("rightmove page %d error: %s", page, exc)
                break

    logger.info("rightmove_windhoek: found %d listings", len(listings))
    return listings


# ─── Combined scan ────────────────────────────────────────────────────────────

async def scrape_all_namibia(city: str = "windhoek", max_pages: int = 2) -> List[Dict[str, Any]]:
    """Run all four Namibian scrapers and return combined results."""
    import asyncio

    results = await asyncio.gather(
        scrape_property24(city, max_pages),
        scrape_propertynews(city, max_pages),
        scrape_myproperty(city, max_pages),
        scrape_rightmove_windhoek(max_pages),
        return_exceptions=True,
    )

    combined: List[Dict[str, Any]] = []
    for r in results:
        if isinstance(r, list):
            combined.extend(r)
        else:
            logger.warning("Namibia scraper error: %s", r)

    logger.info("scrape_all_namibia: total %d listings", len(combined))
    return combined
