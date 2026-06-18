"""
Rent Scout — Automated n8n Workflow Importer
Run this AFTER Docker services are up and n8n is healthy.

Usage:
    python import_n8n_workflows.py
    N8N_EMAIL=you@email.com N8N_PASSWORD=yourpassword python import_n8n_workflows.py
"""

import json
import os
import sys
import time
import requests
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

N8N_URL       = os.getenv("N8N_URL",      "http://localhost:5678")
N8N_EMAIL     = os.getenv("N8N_EMAIL",    "orilionaobeb@gmail.com")
N8N_PASSWORD  = os.getenv("N8N_PASSWORD", "Rentscout123!")
N8N_API_KEY   = os.getenv("N8N_API_KEY",  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyYjgxMTBmYS1jMDNmLTRmYzItODIyNy02OGE5MjgwMjE0NTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZjg1YzFjYTctYTcyYy00MGVjLTlhM2ItM2I5YTIzNzMxMTJjIiwiaWF0IjoxNzgxNzY3MjY4fQ.RD0ztvM8Kho5UuI9W466W2rPdQVqkczqTmNNi3NtNZk")
N8N_API_URL   = f"{N8N_URL}/api/v1"
WORKFLOW_DIR  = os.path.join(os.path.dirname(__file__), "n8n-workflows")

WORKFLOW_FILES = [
    "listing-scanner-workflow.json",
    "property-evaluator-workflow.json",
    "scam-detector-workflow.json",
]


def wait_for_n8n(retries: int = 30, delay: int = 3) -> bool:
    logger.info(f"Waiting for n8n at {N8N_URL}...")
    for attempt in range(retries):
        try:
            r = requests.get(f"{N8N_URL}/healthz", timeout=5)
            if r.status_code == 200:
                logger.info("n8n is ready.")
                return True
        except Exception:
            pass
        logger.info(f"  Attempt {attempt + 1}/{retries} — retrying in {delay}s...")
        time.sleep(delay)
    logger.error("n8n did not become ready in time.")
    return False


def get_api_key() -> str | None:
    """Login to n8n via cookie session, then fetch or create an API key."""
    session = requests.Session()

    # 1. Login to get session cookie
    try:
        r = session.post(
            f"{N8N_URL}/rest/login",
            json={"emailOrLdapLoginId": N8N_EMAIL, "password": N8N_PASSWORD},
            timeout=10,
        )
        if r.status_code not in (200, 201):
            logger.error(f"n8n login failed ({r.status_code}): {r.text[:200]}")
            return None
        logger.info(f"Logged into n8n as {N8N_EMAIL}")
    except Exception as e:
        logger.error(f"Could not connect to n8n login endpoint: {e}")
        return None

    # 2. List existing API keys
    try:
        r = session.get(f"{N8N_URL}/rest/api-keys", timeout=10)
        if r.status_code == 200:
            keys = r.json().get("data", [])
            if keys:
                # We can only see the key label, not the actual key value after creation.
                # Check if our importer key exists — if so, we need to re-create it.
                for k in keys:
                    if k.get("label") == "rentscout-importer":
                        # Delete and recreate to get the actual value
                        session.delete(f"{N8N_URL}/rest/api-keys/{k['id']}", timeout=10)
                        logger.info("Deleted existing rentscout-importer API key (recreating to get value)")
                        break
    except Exception as e:
        logger.warning(f"Could not list API keys: {e}")

    # 3. Create a new API key
    try:
        r = session.post(
            f"{N8N_URL}/rest/api-keys",
            json={"label": "rentscout-importer"},
            timeout=10,
        )
        if r.status_code in (200, 201):
            data = r.json()
            api_key = data.get("apiKey") or data.get("data", {}).get("apiKey")
            if api_key:
                logger.info("Created API key for workflow import.")
                return api_key
        logger.error(f"Could not create API key ({r.status_code}): {r.text[:200]}")
    except Exception as e:
        logger.error(f"Exception creating API key: {e}")

    return None


def get_existing_workflows(api_key: str) -> dict:
    """Return a name→id map of workflows already in n8n."""
    try:
        r = requests.get(
            f"{N8N_API_URL}/workflows",
            headers={"X-N8N-API-KEY": api_key},
            timeout=10,
        )
        if r.status_code == 200:
            data = r.json()
            workflows = data.get("data", data) if isinstance(data, dict) else data
            return {w["name"]: w["id"] for w in workflows}
    except Exception as e:
        logger.warning(f"Could not list existing workflows: {e}")
    return {}


def import_workflow(filepath: str, existing: dict, api_key: str) -> bool:
    with open(filepath, "r") as f:
        workflow = json.load(f)

    name = workflow.get("name", os.path.basename(filepath))

    if name in existing:
        logger.info(f"  '{name}' already exists (id={existing[name]}) — skipping.")
        return True

    payload = {
        "name": name,
        "nodes": workflow.get("nodes", []),
        "connections": workflow.get("connections", {}),
        "settings": workflow.get("settings", {}),
        "staticData": workflow.get("staticData", None),
    }

    try:
        r = requests.post(
            f"{N8N_API_URL}/workflows",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "X-N8N-API-KEY": api_key,
            },
            timeout=15,
        )
        if r.status_code in (200, 201):
            wf_id = r.json().get("id")
            logger.info(f"  Imported '{name}' → id={wf_id}")
            activate_workflow(wf_id, name, api_key)
            return True
        else:
            logger.error(f"  Failed to import '{name}': {r.status_code} — {r.text[:300]}")
            return False
    except Exception as e:
        logger.error(f"  Exception importing '{name}': {e}")
        return False


def activate_workflow(workflow_id: str, name: str, api_key: str) -> None:
    try:
        r = requests.patch(
            f"{N8N_API_URL}/workflows/{workflow_id}",
            json={"active": True},
            headers={
                "Content-Type": "application/json",
                "X-N8N-API-KEY": api_key,
            },
            timeout=10,
        )
        if r.status_code == 200:
            logger.info(f"  Activated '{name}'")
        else:
            logger.warning(f"  Could not activate '{name}': {r.status_code}")
    except Exception as e:
        logger.warning(f"  Exception activating '{name}': {e}")


def main():
    print("=" * 60)
    print("  RENT SCOUT — n8n WORKFLOW IMPORTER")
    print("=" * 60)

    if not wait_for_n8n():
        sys.exit(1)

    api_key = N8N_API_KEY or get_api_key()
    if not api_key:
        print("\nCould not obtain n8n API key automatically.")
        print("To fix: open http://localhost:5678 > Settings > API > Create key")
        print("Then run:  N8N_API_KEY=<your-key> python import_n8n_workflows.py")
        sys.exit(1)

    existing = get_existing_workflows(api_key)
    logger.info(f"Found {len(existing)} existing workflow(s) in n8n.")

    success = 0
    for filename in WORKFLOW_FILES:
        filepath = os.path.join(WORKFLOW_DIR, filename)
        if not os.path.exists(filepath):
            logger.warning(f"  Workflow file not found: {filepath}")
            continue
        logger.info(f"Importing {filename}...")
        if import_workflow(filepath, existing, api_key):
            success += 1

    print("=" * 60)
    print(f"  Done: {success}/{len(WORKFLOW_FILES)} workflows imported/verified.")
    print("  Visit http://localhost:5678 to manage workflows.")
    print("=" * 60)


if __name__ == "__main__":
    main()
