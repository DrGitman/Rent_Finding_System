"""
Integrations router — manage third-party credentials (Facebook, etc.)
Credentials are saved to the backend .env file and reloaded in memory.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import User
from api.routers.auth import get_current_user
from config.credentials import credentials
from pydantic import BaseModel
from typing import Optional
import os
import re

router = APIRouter()

ENV_FILE = os.path.join(os.path.dirname(__file__), "..", "..", ".env")


def _set_env_var(key: str, value: str):
    """Write or update a single key=value line in the .env file."""
    env_path = os.path.abspath(ENV_FILE)
    lines: list[str] = []

    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            lines = f.readlines()

    # Replace existing line or append
    pattern = re.compile(rf"^{re.escape(key)}\s*=")
    replaced = False
    for i, line in enumerate(lines):
        if pattern.match(line):
            lines[i] = f"{key}={value}\n"
            replaced = True
            break

    if not replaced:
        lines.append(f"{key}={value}\n")

    with open(env_path, "w") as f:
        f.writelines(lines)


# ─── Facebook ─────────────────────────────────────────────────────────────────

class FacebookCredentials(BaseModel):
    email: str
    password: str


@router.get("/facebook/status")
def facebook_status(current_user: User = Depends(get_current_user)):
    """Return whether Facebook credentials are configured."""
    return {
        "connected": bool(credentials.facebook_email and credentials.facebook_password),
        "email": credentials.facebook_email or None,
    }


@router.post("/facebook/credentials")
def save_facebook_credentials(
    data: FacebookCredentials,
    current_user: User = Depends(get_current_user),
):
    """
    Save Facebook login credentials to the .env file and update in-memory config.
    These are used by the Playwright scraper to log into Facebook Marketplace.
    """
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    try:
        _set_env_var("FACEBOOK_EMAIL", data.email)
        _set_env_var("FACEBOOK_PASSWORD", data.password)

        # Update in-memory credentials immediately (no restart needed)
        credentials.facebook_email = data.email
        credentials.facebook_password = data.password

        return {"success": True, "message": "Facebook credentials saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save credentials: {str(e)}")


@router.delete("/facebook/credentials")
def remove_facebook_credentials(current_user: User = Depends(get_current_user)):
    """Remove saved Facebook credentials."""
    try:
        _set_env_var("FACEBOOK_EMAIL", "")
        _set_env_var("FACEBOOK_PASSWORD", "")
        credentials.facebook_email = None
        credentials.facebook_password = None
        return {"success": True, "message": "Facebook credentials removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
