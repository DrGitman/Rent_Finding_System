from fastapi import APIRouter
from typing import Dict, Any
import re
import httpx
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/address")
async def validate_address(data: Dict[str, Any]):
    """Validate and verify rental address"""
    try:
        address = data.get("address", "")
        
        # Basic validation
        is_valid = len(address) > 5
        
        # Check if it looks residential
        commercial_keywords = ["office", "commercial", "industrial", "warehouse", "storage"]
        is_residential = not any(kw in address.lower() for kw in commercial_keywords)
        
        # Try to geocode (would use Google Maps API in production)
        geocoded = {
            "address": address,
            "lat": None,
            "lng": None,
            "country": "US"
        }
        
        return {
            "address": address,
            "is_valid": is_valid,
            "is_residential": is_residential,
            "geocoded": geocoded,
            "confidence": 0.7 if is_valid else 0.0
        }
    except Exception as e:
        logger.error(f"Address validation error: {str(e)}")
        return {
            "address": data.get("address"),
            "is_valid": False,
            "error": str(e)
        }

@router.get("/reputation")
async def check_owner_reputation(source: str = "unknown"):
    """Check reputation of listing owner/source"""
    try:
        # In production, this would query a reputation database
        # or scrape review sites for the landlord/company
        
        reputation_scores = {
            "zillow": {"avg_rating": 4.2, "reported_count": 5, "verified": True},
            "apartments": {"avg_rating": 4.0, "reported_count": 3, "verified": True},
            "craigslist": {"avg_rating": 2.8, "reported_count": 15, "verified": False},
            "facebook_marketplace": {"avg_rating": 3.5, "reported_count": 8, "verified": False},
            "whatsapp_groups": {"avg_rating": 3.0, "reported_count": 10, "verified": False},
        }
        
        reputation = reputation_scores.get(source, {
            "avg_rating": 2.5,
            "reported_count": 20,
            "verified": False
        })
        
        return {
            "source": source,
            "avg_rating": reputation["avg_rating"],
            "reported_count": reputation["reported_count"],
            "verified": reputation["verified"],
            "risk_level": "high" if reputation["reported_count"] > 10 else
                         "medium" if reputation["reported_count"] > 5 else "low"
        }
    except Exception as e:
        logger.error(f"Reputation check error: {str(e)}")
        return {
            "source": source,
            "error": str(e)
        }

@router.post("/listing/ai-score")
async def calculate_ai_score(data: Dict[str, Any]):
    """Calculate AI score based on property characteristics"""
    try:
        price = int(data.get("price", 1500))
        beds = int(data.get("beds", 2))
        baths = int(data.get("baths", 1))
        sqft = int(data.get("sqft", 900))
        location_score = int(data.get("location_score", 50))
        
        # Calculate price per sqft
        price_per_sqft = price / sqft if sqft > 0 else 0
        
        # Market analysis (would use real market data)
        market_avg_price_per_sqft = 2.0
        
        # Score calculation
        value_score = 100 if price_per_sqft < market_avg_price_per_sqft else \
                     50 if price_per_sqft < market_avg_price_per_sqft * 1.2 else 0
        
        space_score = min(100, (sqft / 900) * 100)  # 900 sqft = 100 score
        
        bedrooms_score = min(100, (beds / 3) * 100)  # 3 beds = 100 score
        
        # Combined score
        ai_score = int((value_score * 0.3) + (space_score * 0.3) + 
                      (bedrooms_score * 0.2) + (location_score * 0.2))
        
        return {
            "ai_score": min(100, max(0, ai_score)),
            "value_score": value_score,
            "space_score": space_score,
            "bedrooms_score": bedrooms_score,
            "price_per_sqft": round(price_per_sqft, 2),
            "market_comparison": "below market" if price_per_sqft < market_avg_price_per_sqft 
                                else "at market" if price_per_sqft < market_avg_price_per_sqft * 1.2
                                else "above market"
        }
    except Exception as e:
        logger.error(f"AI score calculation error: {str(e)}")
        return {
            "error": str(e),
            "ai_score": 50
        }

@router.post("/listing/scam-patterns")
async def detect_scam_patterns(data: Dict[str, Any]):
    """Detect common scam patterns in listing text"""
    try:
        title = data.get("title", "")
        description = data.get("description", "")
        text = f"{title} {description}".lower()
        
        scam_patterns = {
            "payment_scams": [
                r"wire\s*transfer",
                r"money\s*order",
                r"gift\s*card",
                r"bitcoin|crypto|cryptocurrency",
                r"western\s*union",
                r"bank\s*transfer\s*only"
            ],
            "urgency_scams": [
                r"urgent",
                r"asap|as\s*soon\s*as\s*possible",
                r"hurry|hurry\s*up",
                r"limited\s*time",
                r"act\s*now"
            ],
            "price_scams": [
                r"\$\s*0\s*deposit",
                r"incredibly\s*cheap",
                r"half\s*price",
                r"steal\s*at\s*this\s*price"
            ],
            "identity_scams": [
                r"no\s*background\s*check",
                r"no\s*credit\s*check",
                r"no\s*verification",
                r"no\s*references\s*needed"
            ]
        }
        
        detected_patterns = {}
        pattern_count = 0
        
        for pattern_type, patterns in scam_patterns.items():
            matches = []
            for pattern in patterns:
                if re.search(pattern, text):
                    matches.append(pattern)
                    pattern_count += 1
            if matches:
                detected_patterns[pattern_type] = matches
        
        risk_score = min(100, pattern_count * 15)
        
        return {
            "detected_patterns": detected_patterns,
            "pattern_count": pattern_count,
            "risk_score": risk_score,
            "is_high_risk": risk_score > 60
        }
    except Exception as e:
        logger.error(f"Scam pattern detection error: {str(e)}")
        return {
            "error": str(e),
            "detected_patterns": {},
            "pattern_count": 0,
            "risk_score": 0
        }
