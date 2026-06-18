import httpx
import logging
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

WHATSAPP_SERVICE_URL = "http://whatsapp-service:3001"


class WhatsAppGroupIntegration:
    """
    Calls the whatsapp-service Node.js microservice which uses whatsapp-web.js
    to read messages from your WhatsApp groups.

    On first start the service prints a QR code — scan it with your phone once
    and the session is saved permanently in the Docker volume.
    """

    def __init__(self):
        self.timeout = 30.0

    async def _service_ready(self) -> bool:
        """Check if whatsapp-service is up and WhatsApp is authenticated."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(f"{WHATSAPP_SERVICE_URL}/health")
                data = r.json()
                return data.get("whatsapp_ready", False)
        except Exception:
            return False

    async def search_group_listings(
        self,
        group_keywords: List[str] = None,
        search_terms: List[str] = None,
        days_back: int = 7,
    ) -> List[Dict[str, Any]]:
        """Search WhatsApp groups for rental listings via the whatsapp-service."""
        keywords = search_terms or group_keywords or [
            "rent", "flat", "room", "house", "accommodation",
            "apartment", "available", "letting", "to let",
        ]

        if not await self._service_ready():
            logger.warning(
                "WhatsApp service not ready. "
                "Visit http://localhost:3001/qr to scan the QR code with your phone."
            )
            return []

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                r = await client.post(
                    f"{WHATSAPP_SERVICE_URL}/search",
                    json={"keywords": keywords, "days_back": days_back},
                )
                if r.status_code == 200:
                    data = r.json()
                    listings = data.get("listings", [])
                    logger.info(f"WhatsApp search returned {len(listings)} listings")
                    return listings
                else:
                    logger.error(f"WhatsApp service error: {r.status_code} {r.text[:200]}")
                    return []
        except Exception as e:
            logger.error(f"Error calling WhatsApp service: {e}")
            return []

    async def list_groups(self) -> List[Dict[str, Any]]:
        """Return all WhatsApp groups the user is in."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                r = await client.get(f"{WHATSAPP_SERVICE_URL}/groups")
                if r.status_code == 200:
                    return r.json().get("groups", [])
        except Exception as e:
            logger.error(f"Error listing WhatsApp groups: {e}")
        return []

    async def get_service_status(self) -> Dict[str, Any]:
        """Get status of the whatsapp-service."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(f"{WHATSAPP_SERVICE_URL}/status")
                return r.json()
        except Exception:
            return {"ready": False, "error": "Service unreachable"}

    # ── Keep send_listing_inquiry for compatibility ──────────────────────────
    async def send_listing_inquiry(
        self,
        phone_number: str,
        listing_id: str,
        message: str = None,
    ) -> Dict[str, Any]:
        default_message = (
            f"Hi! I'm interested in this rental listing (ID: {listing_id}). "
            "Could you provide more information about availability and lease terms?"
        )
        logger.info(
            f"send_listing_inquiry called for {phone_number} — "
            "outbound WhatsApp messages not yet supported in this version."
        )
        return {"success": False, "error": "Outbound not implemented yet"}


# Singleton instance
whatsapp_integration = WhatsAppGroupIntegration()
