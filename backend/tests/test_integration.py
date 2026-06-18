"""
End-to-end integration tests for Rent Finding System.
Tests the complete workflow from scraping to evaluation to database updates.

Run with: pytest backend/tests/test_integration.py -v
"""

import asyncio
import json
import time
import httpx
from datetime import datetime

API_BASE_URL = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json"}


class IntegrationTester:
    """Complete end-to-end workflow tester."""

    def __init__(self, api_url: str = API_BASE_URL):
        self.api_url = api_url
        self.client = httpx.Client(base_url=api_url)
        self.async_client = httpx.AsyncClient(base_url=api_url)
        self.test_user_email = f"test-{int(time.time())}@example.com"
        self.test_password = "TestPass123!@#"
        self.auth_token = None
        self.test_results = {
            "passed": [],
            "failed": [],
            "start_time": datetime.now().isoformat(),
        }

    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level:8} | {message}")

    def log_success(self, test_name: str, details: str = ""):
        """Log successful test."""
        self.log(f"✓ {test_name}", "SUCCESS")
        if details:
            self.log(f"  └─ {details}", "")
        self.test_results["passed"].append(test_name)

    def log_error(self, test_name: str, error: str):
        """Log failed test."""
        self.log(f"✗ {test_name}: {error}", "ERROR")
        self.test_results["failed"].append((test_name, error))

    # ==================== Auth Tests ====================

    def test_user_registration(self):
        """Test 1: User registration."""
        try:
            response = self.client.post(
                "/api/auth/register",
                json={
                    "email": self.test_user_email,
                    "password": self.test_password,
                    "full_name": "Test User",
                },
                headers=HEADERS,
            )
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.log_success(
                    "User Registration",
                    f"Created user: {self.test_user_email}",
                )
                return True
            else:
                self.log_error(
                    "User Registration",
                    f"Status {response.status_code}: {response.text}",
                )
                return False
        except Exception as e:
            self.log_error("User Registration", str(e))
            return False

    def test_user_login(self):
        """Test 2: User login."""
        if not self.auth_token:
            self.test_user_registration()

        try:
            response = self.client.post(
                "/api/auth/login",
                json={"email": self.test_user_email, "password": self.test_password},
                headers=HEADERS,
            )
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                self.auth_token = token
                self.log_success("User Login", f"Token obtained: {token[:20]}...")
                return True
            else:
                self.log_error("User Login", f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_error("User Login", str(e))
            return False

    # ==================== Scraper Tests ====================

    def test_zillow_scraper(self):
        """Test 3: Zillow property scraper."""
        try:
            response = self.client.post(
                "/api/scrapers/zillow",
                json={"city": "Austin, TX", "max_pages": 1},
                headers={**HEADERS, "Authorization": f"Bearer {self.auth_token}"},
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data.get("listings", []))
                self.log_success(
                    "Zillow Scraper", f"Retrieved {count} listings from Zillow"
                )
                return True
            else:
                self.log_error("Zillow Scraper", f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Zillow Scraper", str(e))
            return False

    def test_facebook_marketplace_scraper(self):
        """Test 4: Facebook Marketplace property scraper."""
        try:
            response = self.client.post(
                "/api/scrapers/facebook",
                json={"city": "Austin, TX", "max_pages": 1},
                headers={**HEADERS, "Authorization": f"Bearer {self.auth_token}"},
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data.get("listings", []))
                self.log_success(
                    "Facebook Marketplace Scraper",
                    f"Retrieved {count} listings",
                )
                return True
            else:
                self.log_error(
                    "Facebook Marketplace Scraper", f"Status {response.status_code}"
                )
                return False
        except Exception as e:
            self.log_error("Facebook Marketplace Scraper", str(e))
            return False

    def test_whatsapp_groups_scraper(self):
        """Test 5: WhatsApp groups property extractor."""
        try:
            response = self.client.post(
                "/api/scrapers/whatsapp-groups",
                json={"group_ids": ["123456789"], "limit": 10},
                headers={**HEADERS, "Authorization": f"Bearer {self.auth_token}"},
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data.get("listings", []))
                self.log_success(
                    "WhatsApp Groups Extractor",
                    f"Retrieved {count} property messages",
                )
                return True
            else:
                self.log_error(
                    "WhatsApp Groups Extractor", f"Status {response.status_code}"
                )
                return False
        except Exception as e:
            self.log_error("WhatsApp Groups Extractor", str(e))
            return False

    # ==================== Listing Management Tests ====================

    def test_create_listing(self):
        """Test 6: Create a saved listing."""
        try:
            response = self.client.post(
                "/api/listings/",
                json={
                    "title": "Beautiful 2BR Apartment",
                    "price": 1500,
                    "source": "zillow",
                    "url": "https://example.com/listing/123",
                    "image_url": "https://example.com/image.jpg",
                    "ai_score": 85,
                    "scam_risk": 10,
                    "notes": "Great location, needs viewing",
                },
                headers={**HEADERS, "Authorization": f"Bearer {self.auth_token}"},
            )
            if response.status_code == 200:
                data = response.json()
                listing_id = data.get("id")
                self.log_success(
                    "Create Listing",
                    f"Created listing ID: {listing_id}",
                )
                return listing_id
            else:
                self.log_error(
                    "Create Listing", f"Status {response.status_code}: {response.text}"
                )
                return None
        except Exception as e:
            self.log_error("Create Listing", str(e))
            return None

    def test_list_listings(self):
        """Test 7: List user's saved listings."""
        try:
            response = self.client.get(
                "/api/listings/",
                headers={"Authorization": f"Bearer {self.auth_token}"},
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data.get("listings", []))
                self.log_success("List Listings", f"Retrieved {count} listings")
                return True
            else:
                self.log_error("List Listings", f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_error("List Listings", str(e))
            return False

    def test_filter_listings(self):
        """Test 8: Filter listings by criteria."""
        try:
            response = self.client.get(
                "/api/listings/?source=zillow&price_min=1000&price_max=2000&ai_score_min=50",
                headers={"Authorization": f"Bearer {self.auth_token}"},
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data.get("listings", []))
                self.log_success("Filter Listings", f"Filtered returned {count} items")
                return True
            else:
                self.log_error("Filter Listings", f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Filter Listings", str(e))
            return False

    # ==================== Evaluator Tests ====================

    def test_location_evaluator(self):
        """Test 9: Evaluate property location."""
        try:
            response = self.client.post(
                "/api/evaluators/location",
                json={
                    "address": "123 Main St, Austin, TX 78701",
                    "user_preferences": {"preferred_areas": ["downtown", "south"]},
                },
                headers={**HEADERS, "Authorization": f"Bearer {self.auth_token}"},
            )
            if response.status_code == 200:
                data = response.json()
                score = data.get("score")
                self.log_success("Location Evaluator", f"Location score: {score}/100")
                return True
            else:
                self.log_error(
                    "Location Evaluator", f"Status {response.status_code}"
                )
                return False
        except Exception as e:
            self.log_error("Location Evaluator", str(e))
            return False

    def test_amenities_evaluator(self):
        """Test 10: Evaluate property amenities."""
        try:
            response = self.client.post(
                "/api/evaluators/amenities",
                json={
                    "amenities": ["gym", "pool", "parking", "laundry"],
                    "user_preferences": {"must_have": ["parking"]},
                },
                headers={**HEADERS, "Authorization": f"Bearer {self.auth_token}"},
            )
            if response.status_code == 200:
                data = response.json()
                score = data.get("score")
                self.log_success("Amenities Evaluator", f"Amenities score: {score}/100")
                return True
            else:
                self.log_error(
                    "Amenities Evaluator", f"Status {response.status_code}"
                )
                return False
        except Exception as e:
            self.log_error("Amenities Evaluator", str(e))
            return False

    # ==================== Validator Tests ====================

    def test_address_validation(self):
        """Test 11: Validate property address."""
        try:
            response = self.client.post(
                "/api/validators/address",
                json={"address": "123 Main St, Austin, TX 78701"},
                headers={**HEADERS, "Authorization": f"Bearer {self.auth_token}"},
            )
            if response.status_code == 200:
                data = response.json()
                is_valid = data.get("is_valid")
                self.log_success(
                    "Address Validator",
                    f"Address valid: {is_valid}",
                )
                return True
            else:
                self.log_error("Address Validator", f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Address Validator", str(e))
            return False

    def test_scam_detection(self):
        """Test 12: Detect scam patterns in listing."""
        try:
            response = self.client.post(
                "/api/validators/listing/scam-patterns",
                json={
                    "title": "Amazing 5BR House Only $300/month!!!",
                    "description": "Wire transfer ASAP or deal is gone. Urgent!!!",
                    "price": 300,
                    "has_photos": False,
                },
                headers={**HEADERS, "Authorization": f"Bearer {self.auth_token}"},
            )
            if response.status_code == 200:
                data = response.json()
                risk_score = data.get("risk_score", 0)
                red_flags = data.get("red_flags", [])
                self.log_success(
                    "Scam Detection",
                    f"Risk: {risk_score}%, Flags: {len(red_flags)}",
                )
                return True
            else:
                self.log_error("Scam Detection", f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Scam Detection", str(e))
            return False

    # ==================== Webhook Tests ====================

    def test_webhook_callback(self):
        """Test 13: Webhook callback for listing evaluation."""
        try:
            # Create a listing first
            create_response = self.client.post(
                "/api/listings/",
                json={
                    "title": "Test Property for Webhook",
                    "price": 1800,
                    "source": "craigslist",
                    "url": "https://example.com/test",
                },
                headers={**HEADERS, "Authorization": f"Bearer {self.auth_token}"},
            )

            if create_response.status_code != 200:
                self.log_error("Webhook Callback", "Failed to create test listing")
                return False

            listing_data = create_response.json()
            listing_id = listing_data.get("id")

            # Simulate n8n webhook callback
            callback_response = self.client.post(
                f"/api/webhooks/agent-activity",
                json={
                    "event_type": "listing_evaluated",
                    "listing_id": listing_id,
                    "ai_score": 78,
                    "scam_risk": 15,
                    "metadata": {"source": "n8n_workflow_123"},
                },
                headers=HEADERS,
            )

            if callback_response.status_code == 200:
                self.log_success(
                    "Webhook Callback",
                    f"Webhook processed for listing {listing_id}",
                )
                return True
            else:
                self.log_error(
                    "Webhook Callback",
                    f"Status {callback_response.status_code}",
                )
                return False
        except Exception as e:
            self.log_error("Webhook Callback", str(e))
            return False

    # ==================== Main Runner ====================

    def run_all_tests(self):
        """Run complete test suite."""
        print("\n" + "=" * 70)
        print("  RENT FINDING SYSTEM - END-TO-END INTEGRATION TEST SUITE")
        print("=" * 70 + "\n")

        # Auth tests
        print("📋 AUTHENTICATION TESTS")
        print("-" * 70)
        self.test_user_registration()
        self.test_user_login()

        # Scraper tests
        print("\n📡 SCRAPER TESTS")
        print("-" * 70)
        self.test_zillow_scraper()
        self.test_facebook_marketplace_scraper()
        self.test_whatsapp_groups_scraper()

        # Listing management tests
        print("\n📦 LISTING MANAGEMENT TESTS")
        print("-" * 70)
        self.test_create_listing()
        self.test_list_listings()
        self.test_filter_listings()

        # Evaluator tests
        print("\n⭐ EVALUATOR TESTS")
        print("-" * 70)
        self.test_location_evaluator()
        self.test_amenities_evaluator()

        # Validator tests
        print("\n✓ VALIDATOR TESTS")
        print("-" * 70)
        self.test_address_validation()
        self.test_scam_detection()

        # Webhook tests
        print("\n🔗 WEBHOOK TESTS")
        print("-" * 70)
        self.test_webhook_callback()

        # Summary
        print("\n" + "=" * 70)
        print("  TEST SUMMARY")
        print("=" * 70)
        passed = len(self.test_results["passed"])
        failed = len(self.test_results["failed"])
        total = passed + failed
        success_rate = (passed / total * 100) if total > 0 else 0

        print(f"✓ Passed: {passed}")
        print(f"✗ Failed: {failed}")
        print(f"Total:  {total}")
        print(f"Success Rate: {success_rate:.1f}%\n")

        if self.test_results["failed"]:
            print("Failed Tests:")
            for test_name, error in self.test_results["failed"]:
                print(f"  - {test_name}: {error}")

        print("=" * 70 + "\n")

        return success_rate >= 80  # Test suite passes if 80%+ pass


if __name__ == "__main__":
    tester = IntegrationTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)
