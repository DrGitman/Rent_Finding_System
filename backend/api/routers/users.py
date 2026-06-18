from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import User, UserProfile
from schemas.schemas import UserProfileUpdate, UserProfileResponse, UserResponse
from api.routers.auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "created_at": current_user.created_at
    }

@router.put("/me", response_model=UserResponse)
def update_user(
    user_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    for key, value in user_data.items():
        if hasattr(current_user, key):
            setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "created_at": current_user.created_at
    }

@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        # Create default profile
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return profile

@router.post("/profile/onboarding", response_model=UserProfileResponse)
def complete_onboarding(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Onboarding endpoint to set initial preferences"""
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
    
    # Update profile with provided data
    update_data = profile_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return profile

@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
    
    # Update only provided fields
    update_data = profile_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return profile
