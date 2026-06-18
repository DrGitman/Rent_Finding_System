from fastapi import APIRouter
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/location")
async def evaluate_location(data: Dict[str, Any]):
    """Evaluate location score for a property"""
    try:
        address = data.get("address", "")
        user_preferences = data.get("user_preferences", {})
        
        # Extract user preferences
        target_city = user_preferences.get("city", "")
        neighborhoods = user_preferences.get("neighborhoods", [])
        search_radius_km = user_preferences.get("search_radius_km", 5)
        
        # Initialize scores
        location_score = 50
        neighborhood_score = 50
        commute_score = 50
        
        # Check if in preferred city (simplified)
        if target_city.lower() in address.lower():
            location_score = 85
        
        # Check if in preferred neighborhoods
        if any(hood.lower() in address.lower() for hood in neighborhoods):
            neighborhood_score = 95
        elif address.lower() == target_city.lower():
            neighborhood_score = 60
        
        # Commute estimation (simplified - would use real API)
        # Estimate based on city center distance
        commute_score = 75 if location_score > 80 else 50
        
        # Combined location score
        final_location_score = int(
            (location_score * 0.5) + 
            (neighborhood_score * 0.3) + 
            (commute_score * 0.2)
        )
        
        return {
            "address": address,
            "location_score": min(100, max(0, final_location_score)),
            "neighborhood_score": neighborhood_score,
            "commute_score": commute_score,
            "in_target_city": target_city.lower() in address.lower(),
            "in_preferred_neighborhood": any(hood.lower() in address.lower() for hood in neighborhoods)
        }
    except Exception as e:
        logger.error(f"Location evaluation error: {str(e)}")
        return {
            "error": str(e),
            "location_score": 50
        }

@router.post("/amenities")
async def evaluate_amenities(data: Dict[str, Any]):
    """Evaluate property amenities"""
    try:
        beds = int(data.get("beds", 0))
        baths = int(data.get("baths", 0))
        sqft = int(data.get("sqft", 0))
        amenities = data.get("amenities", [])
        
        # Bedroom score
        bedroom_score = min(100, (beds / 3) * 100)
        
        # Bathroom score
        bathroom_score = min(100, (baths / 2) * 100)
        
        # Space score
        space_score = min(100, (sqft / 1200) * 100) if sqft > 0 else 50
        
        # Amenities bonus
        premium_amenities = {
            "pool": 15,
            "gym": 10,
            "parking": 20,
            "laundry": 10,
            "dishwasher": 5,
            "ac": 5,
            "balcony": 8,
            "hardwood": 5,
            "fireplace": 3,
            "doorman": 8
        }
        
        amenities_score = 50
        for amenity in amenities:
            amenities_score += premium_amenities.get(amenity.lower(), 0)
        amenities_score = min(100, amenities_score)
        
        # Combined amenities score
        final_amenities_score = int(
            (bedroom_score * 0.3) + 
            (bathroom_score * 0.2) + 
            (space_score * 0.3) + 
            (amenities_score * 0.2)
        )
        
        return {
            "bedroom_score": bedroom_score,
            "bathroom_score": bathroom_score,
            "space_score": space_score,
            "amenities_score": amenities_score,
            "amenities_found": len(amenities),
            "total_amenities_score": min(100, final_amenities_score)
        }
    except Exception as e:
        logger.error(f"Amenities evaluation error: {str(e)}")
        return {
            "error": str(e),
            "total_amenities_score": 50
        }

@router.post("/price-value")
async def evaluate_price_value(data: Dict[str, Any]):
    """Evaluate price-to-value ratio"""
    try:
        price = int(data.get("price", 1500))
        beds = int(data.get("beds", 2))
        baths = int(data.get("baths", 1))
        sqft = int(data.get("sqft", 900))
        user_budget = data.get("user_budget", {})
        
        min_budget = user_budget.get("min", 500)
        max_budget = user_budget.get("max", 3000)
        
        # Price per sqft comparison
        price_per_sqft = price / sqft if sqft > 0 else 0
        market_avg = 2.0  # Market average price per sqft
        
        # Budget alignment
        if min_budget <= price <= max_budget:
            budget_score = 90
        elif price < min_budget:
            budget_score = 70
        else:
            budget_score = max(0, 100 - ((price - max_budget) / max_budget * 50))
        
        # Value comparison
        if price_per_sqft < market_avg * 0.8:
            value_score = 95
        elif price_per_sqft < market_avg:
            value_score = 85
        elif price_per_sqft < market_avg * 1.2:
            value_score = 70
        else:
            value_score = 50
        
        # Price per bedroom
        price_per_bed = price / beds if beds > 0 else price
        
        final_score = int((budget_score * 0.6) + (value_score * 0.4))
        
        return {
            "price": price,
            "budget_score": budget_score,
            "value_score": value_score,
            "price_per_sqft": round(price_per_sqft, 2),
            "market_comparison": "below market" if price_per_sqft < market_avg else 
                                "at market" if price_per_sqft < market_avg * 1.2 else 
                                "above market",
            "price_per_bedroom": round(price_per_bed, 2),
            "final_price_value_score": min(100, final_score)
        }
    except Exception as e:
        logger.error(f"Price evaluation error: {str(e)}")
        return {
            "error": str(e),
            "final_price_value_score": 50
        }

@router.post("/comprehensive")
async def comprehensive_evaluation(data: Dict[str, Any]):
    """Comprehensive property evaluation combining all factors"""
    try:
        # Location evaluation
        location_result = await evaluate_location({
            "address": data.get("address"),
            "user_preferences": data.get("user_preferences", {})
        })
        
        # Amenities evaluation
        amenities_result = await evaluate_amenities({
            "beds": data.get("beds"),
            "baths": data.get("baths"),
            "sqft": data.get("sqft"),
            "amenities": data.get("amenities", [])
        })
        
        # Price-value evaluation
        price_result = await evaluate_price_value({
            "price": data.get("price"),
            "beds": data.get("beds"),
            "baths": data.get("baths"),
            "sqft": data.get("sqft"),
            "user_budget": data.get("user_budget", {})
        })
        
        # Final AI score
        location_score = location_result.get("location_score", 50)
        amenities_score = amenities_result.get("total_amenities_score", 50)
        price_score = price_result.get("final_price_value_score", 50)
        
        final_ai_score = int(
            (location_score * 0.3) + 
            (amenities_score * 0.4) + 
            (price_score * 0.3)
        )
        
        return {
            "final_ai_score": min(100, max(0, final_ai_score)),
            "location": location_result,
            "amenities": amenities_result,
            "price_value": price_result,
            "recommendation": 
                "⭐⭐⭐⭐⭐ Excellent match!" if final_ai_score >= 85 else
                "⭐⭐⭐⭐ Great option" if final_ai_score >= 70 else
                "⭐⭐⭐ Good option" if final_ai_score >= 55 else
                "⭐⭐ Fair option" if final_ai_score >= 40 else
                "⭐ Consider other options"
        }
    except Exception as e:
        logger.error(f"Comprehensive evaluation error: {str(e)}")
        return {
            "error": str(e),
            "final_ai_score": 50
        }
