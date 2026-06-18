from sqlalchemy import Column, Integer, String, DateTime, Boolean, DECIMAL, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100))
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    avatar_url = Column(String(500))
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = relationship("UserProfile", uselist=False, back_populates="user")
    agents = relationship("AIAgent", back_populates="user")
    rules = relationship("AutomationRule", back_populates="user")
    saved_listings = relationship("SavedListing", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    min_budget = Column(DECIMAL(10, 2))
    max_budget = Column(DECIMAL(10, 2))
    location_city = Column(String(100))
    location_lat = Column(DECIMAL(10, 8))
    location_lng = Column(DECIMAL(11, 8))
    search_radius_km = Column(DECIMAL(5, 2))
    unit_types = Column(JSON)
    preferred_neighborhoods = Column(JSON)
    excluded_neighborhoods = Column(JSON)
    preferred_sources = Column(JSON)
    notification_email = Column(Boolean, default=True)
    notification_sms = Column(Boolean, default=False)
    notification_whatsapp = Column(Boolean, default=False)
    notification_push = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="profile")

class AutomationRule(Base):
    __tablename__ = "automation_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="active")
    conditions = Column(JSONB, nullable=False)
    actions = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="rules")
    activity_logs = relationship("RuleActivityLog", back_populates="rule")

class SavedListing(Base):
    __tablename__ = "saved_listings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    listing_id = Column(String(100), nullable=False)
    title = Column(String(255))
    price = Column(DECIMAL(10, 2))
    source = Column(String(100))  # zillow, apartments, craigslist, facebook, whatsapp
    url = Column(String(500))  # Listing URL
    image_url = Column(String(500))  # Primary image URL
    ai_score = Column(Integer)  # 0-100 AI evaluation score
    scam_risk = Column(Integer)  # 0-100 scam risk percentage
    notes = Column(Text)  # User notes or scam alerts
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_evaluated_at = Column(DateTime)  # When AI score was last updated
    
    user = relationship("User", back_populates="saved_listings")

class AIAgent(Base):
    __tablename__ = "ai_agents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    agent_type = Column(String(100))  # scanner, evaluator, scam_detector, ranker
    source = Column(String(100))  # facebook, zillow, craigslist, etc
    status = Column(String(50), default="active")
    n8n_workflow_id = Column(String(255))
    configuration = Column(JSONB)
    last_run = Column(DateTime)
    next_run = Column(DateTime)
    error_log = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="agents")
    activities = relationship("AgentActivity", back_populates="agent")

class AgentActivity(Base):
    __tablename__ = "agent_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("ai_agents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String(100))
    status = Column(String(50))
    listings_processed = Column(Integer, default=0)
    listings_matched = Column(Integer, default=0)
    scams_detected = Column(Integer, default=0)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    output_data = Column(JSONB)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    agent = relationship("AIAgent", back_populates="activities")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notification_type = Column(String(100))
    title = Column(String(255))
    description = Column(Text)
    related_listing_id = Column(String(100))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime)
    
    user = relationship("User", back_populates="notifications")

class RuleActivityLog(Base):
    __tablename__ = "rule_activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("automation_rules.id"), nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow)
    listings_matched = Column(Integer)
    actions_executed = Column(JSONB)
    
    rule = relationship("AutomationRule", back_populates="activity_logs")
