from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import Notification, User
from schemas.schemas import NotificationResponse
from api.routers.auth import get_current_user
from typing import List, Optional
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    notification_type: Optional[str] = None,
    is_read: Optional[bool] = None,
    limit: int = 50
):
    """List notifications for current user with optional filtering"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    
    notifications = query.order_by(
        Notification.created_at.desc()
    ).limit(limit).all()
    
    return notifications

@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific notification details"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return notification

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    
    db.commit()
    db.refresh(notification)
    
    return notification

@router.put("/{notification_id}/unread", response_model=NotificationResponse)
def mark_as_unread(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as unread"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = False
    notification.read_at = None
    
    db.commit()
    db.refresh(notification)
    
    return notification

@router.post("/mark-all-read")
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user"""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).all()
    
    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": f"Marked {len(notifications)} notifications as read"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted"}

@router.post("/delete-all-read")
def delete_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete all read notifications for current user"""
    deleted_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == True
    ).delete()
    
    db.commit()
    
    return {"message": f"Deleted {deleted_count} read notifications"}

@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return {"unread_count": unread_count}
