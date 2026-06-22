from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from core.database import get_db
from api.routers.auth import get_current_user
from models.models import User, SavedListing
from schemas.schemas import SavedListingResponse
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/")
async def create_listing(
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new saved listing"""
    try:
        listing = SavedListing(
            user_id=current_user.id,
            listing_id=data.get("listing_id", ""),
            title=data.get("title", ""),
            price=data.get("price", 0),
            source=data.get("source", "unknown"),
            url=data.get("url", ""),
            image_url=data.get("image_url", ""),
            notes=data.get("notes", "")
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)
        
        return {
            "id": listing.id,
            "listing_id": listing.listing_id,
            "title": listing.title,
            "price": listing.price,
            "source": listing.source,
            "created_at": listing.created_at
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating listing: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
async def list_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    source: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    ai_score_min: Optional[int] = None,
    scam_risk_max: Optional[int] = None,
    sort_by: str = Query("-created_at")
):
    """List all listings for current user with filtering"""
    try:
        query = db.query(SavedListing).filter(SavedListing.user_id == current_user.id)
        
        # Apply filters
        if source:
            query = query.filter(SavedListing.source == source)
        if min_price is not None:
            query = query.filter(SavedListing.price >= min_price)
        if max_price is not None:
            query = query.filter(SavedListing.price <= max_price)
        if ai_score_min is not None:
            query = query.filter(SavedListing.ai_score >= ai_score_min)
        if scam_risk_max is not None:
            query = query.filter(SavedListing.scam_risk <= scam_risk_max)
        
        # Count total before limit/offset
        total = query.count()
        
        # Apply sorting
        if sort_by.startswith("-"):
            query = query.order_by(getattr(SavedListing, sort_by[1:]).desc())
        else:
            query = query.order_by(getattr(SavedListing, sort_by, SavedListing.created_at))
        
        # Apply pagination
        listings = query.limit(limit).offset(offset).all()
        
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "listings": [
                {
                    "id": l.id,
                    "listing_id": l.listing_id,
                    "title": l.title,
                    "price": l.price,
                    "source": l.source,
                    "url": l.url,
                    "image_url": l.image_url,
                    "ai_score": l.ai_score,
                    "scam_risk": l.scam_risk,
                    "notes": l.notes,
                    "created_at": l.created_at,
                    "updated_at": l.updated_at
                }
                for l in listings
            ]
        }
    except Exception as e:
        logger.error(f"Error listing listings: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/user/saved-count")
async def get_saved_listings_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of saved listings"""
    try:
        count = db.query(SavedListing).filter(SavedListing.user_id == current_user.id).count()
        return {"saved_count": count}
    except Exception as e:
        logger.error(f"Error getting saved count: {str(e)}")
        return {"saved_count": 0}

@router.get("/user/top-sources")
async def get_top_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(5, ge=1, le=20)
):
    """Get listings grouped by source"""
    try:
        all_listings = db.query(SavedListing).filter(SavedListing.user_id == current_user.id).all()
        source_counts: Dict[str, int] = {}
        for listing in all_listings:
            source_counts[listing.source] = source_counts.get(listing.source, 0) + 1
        top_sources = sorted(source_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        return {"sources": [{"source": s, "count": c} for s, c in top_sources]}
    except Exception as e:
        logger.error(f"Error getting top sources: {str(e)}")
        return {"sources": []}

@router.get("/user/statistics")
async def get_listing_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get listing statistics for user"""
    try:
        all_listings = db.query(SavedListing).filter(SavedListing.user_id == current_user.id).all()
        if not all_listings:
            return {"total_listings": 0, "avg_price": 0, "avg_ai_score": 0,
                    "avg_scam_risk": 0, "high_risk_count": 0, "evaluated_count": 0}
        total = len(all_listings)
        prices = [float(l.price) for l in all_listings if l.price is not None]
        avg_price = sum(prices) / len(prices) if prices else 0
        evaluated = [l for l in all_listings if l.ai_score is not None]
        avg_ai_score = sum(l.ai_score for l in evaluated) / len(evaluated) if evaluated else 0
        scam_assessed = [l for l in all_listings if l.scam_risk is not None]
        avg_scam_risk = sum(l.scam_risk for l in scam_assessed) / len(scam_assessed) if scam_assessed else 0
        high_risk = len([l for l in all_listings if l.scam_risk and l.scam_risk > 70])
        return {
            "total_listings": total,
            "avg_price": round(avg_price, 2),
            "avg_ai_score": round(avg_ai_score, 1),
            "avg_scam_risk": round(avg_scam_risk, 1),
            "high_risk_count": high_risk,
            "evaluated_count": len(evaluated)
        }
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{listing_id}")
async def get_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single listing details"""
    try:
        listing = db.query(SavedListing).filter(
            and_(
                SavedListing.id == listing_id,
                SavedListing.user_id == current_user.id
            )
        ).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        return {
            "id": listing.id,
            "listing_id": listing.listing_id,
            "title": listing.title,
            "price": listing.price,
            "source": listing.source,
            "url": listing.url,
            "image_url": listing.image_url,
            "ai_score": listing.ai_score,
            "scam_risk": listing.scam_risk,
            "notes": listing.notes,
            "created_at": listing.created_at,
            "updated_at": listing.updated_at,
            "last_evaluated_at": listing.last_evaluated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting listing: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{listing_id}")
async def update_listing(
    listing_id: int,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update listing information"""
    try:
        listing = db.query(SavedListing).filter(
            and_(
                SavedListing.id == listing_id,
                SavedListing.user_id == current_user.id
            )
        ).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Update fields
        if "title" in data:
            listing.title = data["title"]
        if "notes" in data:
            listing.notes = data["notes"]
        if "price" in data:
            listing.price = data["price"]
        
        listing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(listing)
        
        return {
            "id": listing.id,
            "title": listing.title,
            "price": listing.price,
            "notes": listing.notes,
            "updated_at": listing.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating listing: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{listing_id}/evaluate")
async def update_listing_evaluation(
    listing_id: int,
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Update listing with evaluation results (called from n8n webhook)"""
    try:
        listing = db.query(SavedListing).filter(SavedListing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Update evaluation fields
        listing.ai_score = data.get("ai_score", listing.ai_score)
        listing.last_evaluated_at = datetime.utcnow()
        
        # Store evaluation details in notes if provided
        if data.get("evaluation_details"):
            listing.notes = listing.notes or ""
            listing.notes += f"\n[Evaluation] {data.get('evaluation_details')}"
        
        db.commit()
        db.refresh(listing)
        
        return {
            "success": True,
            "listing_id": listing.id,
            "ai_score": listing.ai_score,
            "last_evaluated_at": listing.last_evaluated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error evaluating listing: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@router.post("/{listing_id}/scam-check")
async def update_listing_scam_assessment(
    listing_id: int,
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Update listing with scam assessment results (called from n8n webhook)"""
    try:
        listing = db.query(SavedListing).filter(SavedListing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Update scam fields
        listing.scam_risk = data.get("scam_risk", listing.scam_risk)
        is_likely_scam = data.get("is_likely_scam", False)
        
        # Add scam alert to notes if detected
        if is_likely_scam:
            scam_flags = data.get("red_flags", [])
            listing.notes = listing.notes or ""
            listing.notes += f"\n[⚠️ SCAM ALERT] Risk Score: {listing.scam_risk}% | Flags: {', '.join(scam_flags)}"
        
        db.commit()
        db.refresh(listing)
        
        return {
            "success": True,
            "listing_id": listing.id,
            "scam_risk": listing.scam_risk,
            "is_likely_scam": is_likely_scam
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error checking scam status: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@router.delete("/{listing_id}")
async def delete_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a listing"""
    try:
        listing = db.query(SavedListing).filter(
            and_(
                SavedListing.id == listing_id,
                SavedListing.user_id == current_user.id
            )
        ).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        db.delete(listing)
        db.commit()
        
        return {
            "success": True,
            "message": "Listing deleted"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting listing: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

