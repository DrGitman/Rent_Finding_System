from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# User Profile schemas
class UserProfileUpdate(BaseModel):
    min_budget: Optional[float] = None
    max_budget: Optional[float] = None
    location_city: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    search_radius_km: Optional[float] = None
    unit_types: Optional[List[str]] = None
    preferred_neighborhoods: Optional[List[str]] = None
    excluded_neighborhoods: Optional[List[str]] = None
    preferred_sources: Optional[List[str]] = None
    notification_email: Optional[bool] = None
    notification_sms: Optional[bool] = None
    notification_whatsapp: Optional[bool] = None
    notification_push: Optional[bool] = None

class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    min_budget: Optional[float]
    max_budget: Optional[float]
    location_city: Optional[str]
    search_radius_km: Optional[float]
    notification_email: bool
    notification_sms: bool
    notification_whatsapp: bool
    notification_push: bool
    
    class Config:
        from_attributes = True

# Automation Rule schemas
class RuleCondition(BaseModel):
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    scam_risk_threshold: Optional[str] = "medium"  # low, medium, high
    ai_score_min: Optional[int] = None
    neighborhoods: Optional[List[str]] = None
    unit_types: Optional[List[str]] = None
    source_filter: Optional[List[str]] = None

class RuleAction(BaseModel):
    notify_email: bool = False
    notify_sms: bool = False
    notify_whatsapp: bool = False
    save_listing: bool = False
    webhook_url: Optional[str] = None

class AutomationRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    conditions: RuleCondition
    actions: RuleAction

class AutomationRuleResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    status: str
    conditions: dict
    actions: dict
    created_at: datetime
    
    class Config:
        from_attributes = True

# AI Agent schemas
class AIAgentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    agent_type: str  # scanner, evaluator, scam_detector, ranker
    source: Optional[str] = None
    configuration: Optional[dict] = None

class AIAgentResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    agent_type: str
    source: Optional[str]
    status: str
    n8n_workflow_id: Optional[str]
    last_run: Optional[datetime]
    next_run: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class AIAgentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    configuration: Optional[dict] = None

# Agent Activity schemas
class AgentActivityResponse(BaseModel):
    id: int
    agent_id: int
    activity_type: str
    status: str
    listings_processed: int
    listings_matched: int
    scams_detected: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Notification schemas
class NotificationResponse(BaseModel):
    id: int
    notification_type: str
    title: str
    description: Optional[str]
    related_listing_id: Optional[str]
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class NotificationMarkRead(BaseModel):
    is_read: bool

# Listing schemas
class SavedListingResponse(BaseModel):
    id: int
    listing_id: str
    title: str
    price: float
    source: str
    url: Optional[str]
    image_url: Optional[str]
    ai_score: Optional[int]
    scam_risk: Optional[int]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_evaluated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
