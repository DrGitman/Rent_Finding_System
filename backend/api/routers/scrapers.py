from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import User, SavedListing, AIAgent
from integrations.property_scraper import property_scraper
from integrations.facebook_marketplace import fb_integration
from integrations.whatsapp_integration import whatsapp_integration
from typing import List, Dict, Any
import asyncio

router = APIRouter()

@router.post("/zillow")
async def scrape_zillow(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Scrape Zillow for rental listings"""
    try:
        city = data.get("city", "San Francisco")
        max_pages = data.get("max_pages", 2)
        
        listings = await property_scraper.scrape_zillow(city, max_pages)
        
        return {
            "success": True,
            "source": "zillow",
            "listings": listings,
            "count": len(listings)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "listings": []
        }

@router.post("/apartments")
async def scrape_apartments(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Scrape Apartments.com for rental listings"""
    try:
        city = data.get("city", "San Francisco")
        max_pages = data.get("max_pages", 2)
        
        listings = await property_scraper.scrape_apartments_com(city, max_pages)
        
        return {
            "success": True,
            "source": "apartments",
            "listings": listings,
            "count": len(listings)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "listings": []
        }

@router.post("/craigslist")
async def scrape_craigslist(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Scrape Craigslist for rental listings"""
    try:
        city = data.get("city", "San Francisco")
        max_pages = data.get("max_pages", 2)
        
        listings = await property_scraper.scrape_craigslist(city, max_pages)
        
        return {
            "success": True,
            "source": "craigslist",
            "listings": listings,
            "count": len(listings)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "listings": []
        }

@router.post("/facebook")
async def scrape_facebook_marketplace(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Scrape Facebook Marketplace for rental listings"""
    try:
        city = data.get("city", "San Francisco")
        keywords = data.get("keywords", ["rental", "apartment", "house"])
        
        listings = await fb_integration.search_listings(
            query="rental",
            location=city
        )
        
        return {
            "success": True,
            "source": "facebook_marketplace",
            "listings": listings,
            "count": len(listings)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "listings": []
        }

@router.post("/whatsapp-groups")
async def search_whatsapp_groups(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Search WhatsApp groups for rental listings"""
    try:
        keywords = data.get("keywords", ["rental", "apartment"])
        search_terms = data.get("search_terms", [])
        days_back = data.get("days_back", 7)
        
        listings = await whatsapp_integration.search_group_listings(
            keywords,
            search_terms,
            days_back
        )
        
        return {
            "success": True,
            "source": "whatsapp_groups",
            "listings": listings,
            "count": len(listings)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "listings": []
        }

@router.post("/listings/batch")
async def store_batch_listings(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Store multiple listings in database"""
    try:
        listings = data.get("listings", [])
        agent_id = data.get("agent_id")
        user_id = data.get("user_id")

        # Resolve user_id from agent if not provided directly
        if not user_id and agent_id:
            agent = db.query(AIAgent).filter(AIAgent.id == agent_id).first()
            if agent:
                user_id = agent.user_id

        saved_count = 0
        for listing_data in listings:
            try:
                # Check if listing already exists (by listing_id or title+price)
                listing_id_val = listing_data.get("listing_id", "")
                existing = db.query(SavedListing).filter(
                    SavedListing.listing_id == listing_id_val
                ).first()
                if not existing:
                    existing = db.query(SavedListing).filter(
                        SavedListing.title == listing_data.get("title"),
                        SavedListing.price == listing_data.get("price")
                    ).first()

                if not existing:
                    saved_listing = SavedListing(
                        user_id=user_id,
                        listing_id=listing_id_val,
                        title=listing_data.get("title", ""),
                        price=listing_data.get("price", 0),
                        source=listing_data.get("source", "unknown"),
                        url=listing_data.get("url", ""),
                        image_url=listing_data.get("image_url", ""),
                        notes=f"Discovered via agent {agent_id}" if agent_id else None
                    )
                    db.add(saved_listing)
                    saved_count += 1
            except Exception as e:
                print(f"Error saving listing: {str(e)}")
                continue
        
        db.commit()
        
        return {
            "success": True,
            "total_listings": len(listings),
            "saved_count": saved_count,
            "duplicates_skipped": len(listings) - saved_count
        }
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "error": str(e)
        }
