"""
Credentials management for third-party API integrations.
Handles secure loading and validation of API keys and tokens.
"""

import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class APICredentials(BaseSettings):
    """Manage all API credentials from environment variables."""

    # Facebook Graph API
    facebook_app_id: Optional[str] = Field(default=None, env="FACEBOOK_APP_ID")
    facebook_app_secret: Optional[str] = Field(default=None, env="FACEBOOK_APP_SECRET")
    facebook_access_token: Optional[str] = Field(
        default=None, env="FACEBOOK_ACCESS_TOKEN"
    )
    facebook_business_account_id: Optional[str] = Field(
        default=None, env="FACEBOOK_BUSINESS_ACCOUNT_ID"
    )
    # Facebook login credentials for Playwright scraping (optional but gives full access)
    facebook_email: Optional[str] = Field(default=None, env="FACEBOOK_EMAIL")
    facebook_password: Optional[str] = Field(default=None, env="FACEBOOK_PASSWORD")

    # WhatsApp Business API
    whatsapp_business_phone: Optional[str] = Field(
        default=None, env="WHATSAPP_BUSINESS_PHONE"
    )
    whatsapp_business_account_id: Optional[str] = Field(
        default=None, env="WHATSAPP_BUSINESS_ACCOUNT_ID"
    )
    whatsapp_api_key: Optional[str] = Field(default=None, env="WHATSAPP_API_KEY")
    whatsapp_access_token: Optional[str] = Field(
        default=None, env="WHATSAPP_ACCESS_TOKEN"
    )

    # Twilio (for WhatsApp)
    twilio_account_sid: Optional[str] = Field(
        default=None, env="TWILIO_ACCOUNT_SID"
    )
    twilio_auth_token: Optional[str] = Field(default=None, env="TWILIO_AUTH_TOKEN")
    twilio_whatsapp_from: Optional[str] = Field(
        default=None, env="TWILIO_WHATSAPP_FROM"
    )

    # Other sources
    zillow_api_key: Optional[str] = Field(default=None, env="ZILLOW_API_KEY")
    apartments_api_key: Optional[str] = Field(default=None, env="APARTMENTS_API_KEY")
    craigslist_proxy_url: Optional[str] = Field(
        default=None, env="CRAIGSLIST_PROXY_URL"
    )

    class Config:
        env_file = ".env"
        case_sensitive = False

    def validate_facebook(self) -> bool:
        """Check if Facebook API credentials are configured."""
        return bool(
            self.facebook_app_id
            and self.facebook_app_secret
            and self.facebook_access_token
        )

    def validate_whatsapp(self) -> bool:
        """Check if WhatsApp API credentials are configured."""
        return bool(
            self.whatsapp_api_key
            or (self.twilio_account_sid and self.twilio_auth_token)
            or self.whatsapp_access_token
        )

    def get_facebook_headers(self) -> dict:
        """Get headers for Facebook API requests."""
        return {
            "Authorization": f"Bearer {self.facebook_access_token}",
            "Content-Type": "application/json",
        }

    def get_whatsapp_headers(self) -> dict:
        """Get headers for WhatsApp API requests."""
        if self.whatsapp_access_token:
            return {
                "Authorization": f"Bearer {self.whatsapp_access_token}",
                "Content-Type": "application/json",
            }
        elif self.whatsapp_api_key:
            return {
                "X-API-Key": self.whatsapp_api_key,
                "Content-Type": "application/json",
            }
        else:
            return {"Content-Type": "application/json"}

    def get_status(self) -> dict:
        """Get status of all configured credentials."""
        return {
            "facebook": {
                "configured": self.validate_facebook(),
                "app_id": bool(self.facebook_app_id),
                "access_token": bool(self.facebook_access_token),
            },
            "whatsapp": {
                "configured": self.validate_whatsapp(),
                "api_key": bool(self.whatsapp_api_key),
                "twilio": bool(self.twilio_account_sid),
                "access_token": bool(self.whatsapp_access_token),
            },
            "other": {
                "zillow": bool(self.zillow_api_key),
                "apartments": bool(self.apartments_api_key),
                "craigslist_proxy": bool(self.craigslist_proxy_url),
            },
        }


# Load credentials from environment
credentials = APICredentials()
