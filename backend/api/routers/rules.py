from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import AutomationRule, RuleActivityLog, User
from schemas.schemas import (
    AutomationRuleCreate, AutomationRuleResponse
)
from api.routers.auth import get_current_user
from typing import List
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=AutomationRuleResponse)
def create_rule(
    rule_data: AutomationRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new automation rule"""
    new_rule = AutomationRule(
        user_id=current_user.id,
        name=rule_data.name,
        description=rule_data.description,
        conditions=rule_data.conditions.dict(),
        actions=rule_data.actions.dict(),
        status="active"
    )
    
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    
    return new_rule

@router.get("/", response_model=List[AutomationRuleResponse])
def list_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all automation rules for current user"""
    rules = db.query(AutomationRule).filter(
        AutomationRule.user_id == current_user.id
    ).all()
    return rules

@router.get("/{rule_id}", response_model=AutomationRuleResponse)
def get_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific rule details"""
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    return rule

@router.put("/{rule_id}", response_model=AutomationRuleResponse)
def update_rule(
    rule_id: int,
    rule_data: AutomationRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an automation rule"""
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule.name = rule_data.name
    rule.description = rule_data.description
    rule.conditions = rule_data.conditions.dict()
    rule.actions = rule_data.actions.dict()
    
    db.commit()
    db.refresh(rule)
    
    return rule

@router.post("/{rule_id}/activate")
def activate_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Activate a rule"""
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule.status = "active"
    db.commit()
    
    return {"message": f"Rule '{rule.name}' activated"}

@router.post("/{rule_id}/deactivate")
def deactivate_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate a rule"""
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule.status = "inactive"
    db.commit()
    
    return {"message": f"Rule '{rule.name}' deactivated"}

@router.delete("/{rule_id}")
def delete_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a rule"""
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Rule deleted"}

@router.get("/{rule_id}/activity")
def get_rule_activity(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Get activity log for a rule (when it was triggered)"""
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    activities = db.query(RuleActivityLog).filter(
        RuleActivityLog.rule_id == rule_id
    ).order_by(RuleActivityLog.triggered_at.desc()).limit(limit).all()
    
    return activities
