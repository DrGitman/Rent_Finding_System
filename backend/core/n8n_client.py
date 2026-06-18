import httpx
import asyncio
from typing import Dict, Any, Optional
from core.config import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class N8nClient:
    """Client for interacting with n8n workflows"""
    
    def __init__(self):
        self.base_url = settings.N8N_WEBHOOK_URL.rstrip('/')
        self.api_url = settings.N8N_API_URL.rstrip('/')
        self.timeout = 30.0
    
    async def create_workflow(
        self,
        name: str,
        agent_type: str,
        configuration: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new workflow in n8n"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    "name": name,
                    "nodes": self._build_workflow_nodes(agent_type, configuration),
                    "connections": self._build_workflow_connections(agent_type),
                    "active": True,
                    "staticData": False
                }
                
                response = await client.post(
                    f"{self.api_url}/workflows",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 201:
                    return response.json()
                else:
                    logger.error(f"Failed to create workflow: {response.text}")
                    return {"error": response.text}
        except Exception as e:
            logger.error(f"Exception creating workflow: {str(e)}")
            return {"error": str(e)}
    
    async def trigger_workflow(
        self,
        workflow_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Trigger a workflow execution via webhook"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                webhook_url = f"{self.base_url}/webhook/{workflow_id}"
                
                response = await client.post(
                    webhook_url,
                    json=data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code in [200, 201]:
                    return {
                        "success": True,
                        "workflow_id": workflow_id,
                        "timestamp": datetime.utcnow().isoformat(),
                        "response": response.json() if response.text else {}
                    }
                else:
                    logger.error(f"Failed to trigger workflow: {response.text}")
                    return {
                        "success": False,
                        "error": response.text
                    }
        except Exception as e:
            logger.error(f"Exception triggering workflow: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_workflow_status(
        self,
        workflow_id: str
    ) -> Dict[str, Any]:
        """Get the execution status of a workflow"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.api_url}/workflows/{workflow_id}/executions",
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "workflow_id": workflow_id,
                        "executions": data.get("data", []),
                        "count": len(data.get("data", []))
                    }
                else:
                    logger.error(f"Failed to get workflow status: {response.text}")
                    return {"error": response.text}
        except Exception as e:
            logger.error(f"Exception getting workflow status: {str(e)}")
            return {"error": str(e)}
    
    async def delete_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Delete a workflow from n8n"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.delete(
                    f"{self.api_url}/workflows/{workflow_id}",
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    return {"success": True, "message": "Workflow deleted"}
                else:
                    logger.error(f"Failed to delete workflow: {response.text}")
                    return {"success": False, "error": response.text}
        except Exception as e:
            logger.error(f"Exception deleting workflow: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _build_workflow_nodes(
        self,
        agent_type: str,
        configuration: Dict[str, Any]
    ) -> list:
        """Build workflow nodes based on agent type"""
        base_nodes = [
            {
                "name": "Webhook",
                "type": "n8n-nodes-base.webhook",
                "typeVersion": 1,
                "position": [250, 300],
                "webhookId": None,
                "parameters": {
                    "path": "webhook",
                    "method": "POST",
                    "responseMode": "onReceived"
                }
            }
        ]
        
        if agent_type == "scanner":
            base_nodes.append({
                "name": "List Scanner",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4,
                "position": [500, 300],
                "parameters": {
                    "method": "GET",
                    "url": configuration.get("api_url", ""),
                    "responseFormat": "json"
                }
            })
        elif agent_type == "evaluator":
            base_nodes.append({
                "name": "AI Evaluator",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [500, 300],
                "parameters": {
                    "jsCode": configuration.get("evaluation_code", "")
                }
            })
        elif agent_type == "scam_detector":
            base_nodes.append({
                "name": "Scam Detection",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4,
                "position": [500, 300],
                "parameters": {
                    "method": "POST",
                    "url": configuration.get("detection_endpoint", ""),
                    "responseFormat": "json"
                }
            })
        
        base_nodes.append({
            "name": "Response",
            "type": "n8n-nodes-base.respond",
            "typeVersion": 3,
            "position": [750, 300],
            "parameters": {
                "responseData": "first"
            }
        })
        
        return base_nodes
    
    def _build_workflow_connections(self, agent_type: str) -> Dict[str, Any]:
        """Build workflow connections between nodes"""
        return {
            "Webhook": {
                "main": [[{"node": "List Scanner" if agent_type == "scanner" else "AI Evaluator" if agent_type == "evaluator" else "Scam Detection", "type": "main", "index": 0}]]
            },
            "List Scanner" if agent_type == "scanner" else "AI Evaluator" if agent_type == "evaluator" else "Scam Detection": {
                "main": [[{"node": "Response", "type": "main", "index": 0}]]
            }
        }


# Singleton instance
n8n_client = N8nClient()


async def trigger_agent_workflow(
    workflow_id: str,
    agent_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Helper function to trigger agent workflow"""
    return await n8n_client.trigger_workflow(workflow_id, agent_data)


async def create_agent_workflow(
    name: str,
    agent_type: str,
    configuration: Dict[str, Any]
) -> Dict[str, Any]:
    """Helper function to create agent workflow"""
    return await n8n_client.create_workflow(name, agent_type, configuration)
