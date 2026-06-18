import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from config.credentials import credentials

logger = logging.getLogger(__name__)

# Default Facebook location IDs for common cities
FACEBOOK_CITY_IDS = {
    "new york": "108424279189115",
    "brooklyn": "110760338952883",
    "los angeles": "108479049168578",
    "san francisco": "114952118516498",
    "chicago": "108659242498155",
    "miami": "110913905612651",
    "london": "106078429431815",
    "cape town": "106399856059456",
    "johannesburg": "111905885494066",
    "durban": "107780879243873",
    "pretoria": "107460249255785",
}


class FacebookMarketplaceIntegration:
    """Facebook Marketplace scraper using Playwright browser automation."""

    def __init__(self):
        self.facebook_email = credentials.facebook_email
        self.facebook_password = credentials.facebook_password
        self.timeout = 30000  # ms
        self._logged_in = False

    async def search_listings(
        self,
        query: str = "rent",
        city: str = None,
        city_id: str = None,
        max_listings: int = 30,
        location: str = None,
    ) -> List[Dict[str, Any]]:
        """
        Search Facebook Marketplace for rental listings using Playwright.
        Works without login (public listings) or with login (full access).
        """
        # Resolve city_id
        resolved_city_id = city_id
        if not resolved_city_id and city:
            resolved_city_id = FACEBOOK_CITY_IDS.get(city.lower())
        if not resolved_city_id and location:
            resolved_city_id = FACEBOOK_CITY_IDS.get(location.lower())

        try:
            return await self._scrape_with_playwright(query, resolved_city_id, max_listings)
        except Exception as e:
            logger.error(f"Playwright scrape failed: {e}")
            return []

    async def _scrape_with_playwright(
        self, query: str, city_id: Optional[str], max_listings: int
    ) -> List[Dict[str, Any]]:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-infobars",
                    "--window-size=1920,1080",
                ],
            )

            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1920, "height": 1080},
                locale="en-US",
                timezone_id="America/New_York",
            )

            # Mask automation signals
            await context.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
            )

            page = await context.new_page()

            try:
                # Log in first if credentials are available — gives full access
                if self.facebook_email and self.facebook_password and not self._logged_in:
                    await self._facebook_login(page)

                # Build marketplace search URL
                if city_id:
                    url = f"https://www.facebook.com/marketplace/{city_id}/search/?query={query}&exact=false"
                else:
                    url = f"https://www.facebook.com/marketplace/search/?query={query}&exact=false"

                logger.info(f"Navigating to: {url}")
                await page.goto(url, wait_until="domcontentloaded", timeout=self.timeout)
                await page.wait_for_timeout(4000)

                # Dismiss cookie consent if present
                for label in ["Allow all cookies", "Accept All", "Allow essential and optional cookies"]:
                    try:
                        btn = page.get_by_role("button", name=label)
                        if await btn.is_visible(timeout=2000):
                            await btn.click()
                            await page.wait_for_timeout(1000)
                            break
                    except Exception:
                        pass

                # Dismiss login modal if we're not logged in
                if not self._logged_in:
                    for selector in ['[aria-label="Close"]', '[data-testid="dialog-close-button"]']:
                        try:
                            btn = page.locator(selector).first
                            if await btn.is_visible(timeout=2000):
                                await btn.click()
                                await page.wait_for_timeout(1000)
                                break
                        except Exception:
                            pass

                # Scroll to load more listings
                for _ in range(3):
                    await page.keyboard.press("End")
                    await page.wait_for_timeout(1500)

                listings = await self._extract_listings(page, city_id)
                logger.info(f"Facebook Marketplace: found {len(listings)} listings for '{query}'")
                return listings[:max_listings]

            finally:
                await browser.close()

    async def _facebook_login(self, page) -> None:
        """Log into Facebook using stored credentials."""
        try:
            logger.info("Logging into Facebook...")
            await page.goto("https://www.facebook.com/", wait_until="domcontentloaded", timeout=self.timeout)
            await page.wait_for_timeout(2000)

            await page.fill("#email", self.facebook_email, timeout=8000)
            await page.fill("#pass", self.facebook_password, timeout=8000)
            await page.click('[name="login"]', timeout=8000)
            await page.wait_for_timeout(4000)

            # Confirm we're logged in
            if "login" not in page.url and "checkpoint" not in page.url:
                self._logged_in = True
                logger.info("Facebook login successful")
            else:
                logger.warning("Facebook login may have failed — continuing without login")
        except Exception as e:
            logger.warning(f"Facebook login error: {e}")

    async def _extract_listings(self, page, city_id: Optional[str]) -> List[Dict[str, Any]]:
        """Extract listing cards from the rendered marketplace page."""
        listings = []

        # Try to grab listing links — FB Marketplace items always have /marketplace/item/ URLs
        raw = await page.evaluate("""
            () => {
                const results = [];
                // All anchor tags pointing to marketplace items
                const links = document.querySelectorAll('a[href*="/marketplace/item/"]');
                for (const link of links) {
                    const text = link.innerText || '';
                    const href = link.getAttribute('href') || '';
                    const img = link.querySelector('img');
                    results.push({
                        href: href,
                        text: text,
                        img: img ? img.getAttribute('src') : ''
                    });
                }
                return results;
            }
        """)

        seen_hrefs = set()
        for item in raw:
            href = item.get("href", "")
            text = item.get("text", "").strip()
            img = item.get("img", "")

            if not href or href in seen_hrefs or len(text) < 3:
                continue
            seen_hrefs.add(href)

            # Parse price — look for currency patterns
            price_match = re.search(r"[R$£€]\s*([\d,]+)", text)
            price = int(price_match.group(1).replace(",", "")) if price_match else 0

            # Parse beds/baths
            beds_match = re.search(r"(\d)\s*(?:bd|bed|bedroom)", text, re.IGNORECASE)
            baths_match = re.search(r"(\d)\s*(?:ba|bath|bathroom)", text, re.IGNORECASE)

            # Split text into lines to find title and address
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            title = lines[0] if lines else text[:80]
            address = lines[-1] if len(lines) > 1 else ""

            url = f"https://www.facebook.com{href}" if href.startswith("/") else href

            listings.append({
                "source": "facebook_marketplace",
                "listing_id": re.search(r"/item/(\d+)/", href).group(1) if re.search(r"/item/(\d+)/", href) else href,
                "title": title,
                "description": text,
                "price": price,
                "address": address,
                "beds": int(beds_match.group(1)) if beds_match else None,
                "baths": int(baths_match.group(1)) if baths_match else None,
                "image_url": img,
                "url": url,
                "posted_at": datetime.now().isoformat(),
            })

        return listings


# Singleton instance
fb_integration = FacebookMarketplaceIntegration()
