from fastapi import APIRouter, Body, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from datetime import datetime
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/agent-activity")
async def handle_agent_activity_webhook(
    payload: Dict[str, Any] = Body(...)
):
    """Webhook endpoint for n8n to post agent activity results"""
    try:
        agent_id = payload.get("agent_id")
        activity_id = payload.get("activity_id")
        status = payload.get("status", "completed")  # completed, failed, error
        listings_processed = payload.get("listings_processed", 0)
        scams_detected = payload.get("scams_detected", 0)
        error_log = payload.get("error_log", None)
        
        if not agent_id:
            raise HTTPException(
                status_code=400,
                detail="agent_id is required in webhook payload"
            )
        
        logger.info(f"Received agent activity webhook for agent {agent_id}, activity {activity_id}")
        
        return {
            "success": True,
            "message": "Activity recorded",
            "agent_id": agent_id,
            "activity_id": activity_id
        }
    except Exception as e:
        logger.error(f"Error processing agent activity webhook: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@router.post("/rule-trigger")
async def handle_rule_trigger_webhook(
    payload: Dict[str, Any] = Body(...)
):
    """Webhook endpoint for n8n to post rule trigger results"""
    try:
        rule_id = payload.get("rule_id")
        listings_matched = payload.get("listings_matched", 0)
        actions_executed = payload.get("actions_executed", {})
        
        if not rule_id:
            raise HTTPException(
                status_code=400,
                detail="rule_id is required in webhook payload"
            )
        
        logger.info(f"Received rule trigger webhook for rule {rule_id}")
        
        return {
            "success": True,
            "message": "Rule trigger recorded",
            "rule_id": rule_id,
            "listings_matched": listings_matched
        }
    except Exception as e:
        logger.error(f"Error processing rule trigger webhook: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@router.post("/listing-evaluated")
async def handle_listing_evaluated_webhook(
    payload: Dict[str, Any] = Body(...)
):
    """Webhook endpoint for n8n to post listing evaluation results"""
    try:
        listing_id = payload.get("listing_id")
        user_id = payload.get("user_id")
        ai_score = payload.get("ai_score")
        scam_risk = payload.get("scam_risk")
        evaluation_details = payload.get("evaluation_details", {})
        
        if not listing_id or not user_id:
            raise HTTPException(
                status_code=400,
                detail="listing_id and user_id are required"
            )
        
        logger.info(f"Received listing evaluation webhook for listing {listing_id}")
        
        return {
            "success": True,
            "message": "Listing evaluation recorded",
            "listing_id": listing_id,
            "ai_score": ai_score,
            "scam_risk": scam_risk
        }
    except Exception as e:
        logger.error(f"Error processing listing evaluation webhook: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@router.post("/scam-alert")
async def handle_scam_alert_webhook(
    payload: Dict[str, Any] = Body(...)
):
    """Webhook endpoint for n8n scam-detector to post scam alerts"""
    try:
        listing_id = payload.get("listing_id")
        scam_risk = payload.get("scam_risk", 0)
        red_flags = payload.get("red_flags", [])
        is_likely_scam = payload.get("is_likely_scam", False)

        if not listing_id:
            raise HTTPException(status_code=400, detail="listing_id is required")

        logger.warning(
            f"Scam alert received — listing {listing_id}, risk {scam_risk}, "
            f"flags: {red_flags}"
        )

        return {
            "success": True,
            "message": "Scam alert recorded",
            "listing_id": listing_id,
            "scam_risk": scam_risk,
            "is_likely_scam": is_likely_scam,
            "red_flags": red_flags,
        }
    except Exception as e:
        logger.error(f"Error processing scam alert webhook: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/health")
async def webhook_health():
    """Health check endpoint for webhooks"""
    return {
        "status": "healthy",
        "service": "webhooks",
        "timestamp": datetime.utcnow().isoformat()
    }
