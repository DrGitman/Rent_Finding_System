from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import AIAgent, AgentActivity, User
from schemas.schemas import (
    AIAgentCreate, AIAgentResponse, AIAgentUpdate,
    AgentActivityResponse
)
from api.routers.auth import get_current_user
from core.n8n_client import n8n_client
from typing import List
from datetime import datetime
import asyncio

router = APIRouter()

@router.post("/", response_model=AIAgentResponse)
def create_agent(
    agent_data: AIAgentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new AI agent"""
    # Create agent in database first
    new_agent = AIAgent(
        user_id=current_user.id,
        name=agent_data.name,
        description=agent_data.description,
        agent_type=agent_data.agent_type,
        source=agent_data.source,
        configuration=agent_data.configuration or {},
        status="active"
    )
    
    db.add(new_agent)
    db.flush()  # Get the agent ID before commit
    
    # Create workflow in n8n (async operation)
    try:
        workflow_result = asyncio.run(n8n_client.create_workflow(
            name=f"{agent_data.name} - {agent_data.agent_type}",
            agent_type=agent_data.agent_type,
            configuration=agent_data.configuration or {}
        ))
        
        if "id" in workflow_result or "data" in workflow_result:
            workflow_id = workflow_result.get("id") or workflow_result.get("data", {}).get("id")
            new_agent.n8n_workflow_id = workflow_id
    except Exception as e:
        print(f"Warning: Could not create n8n workflow: {str(e)}")
        # Continue anyway - agent is created even if workflow creation fails
    
    db.commit()
    db.refresh(new_agent)
    
    return new_agent

@router.get("/", response_model=List[AIAgentResponse])
def list_agents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all agents for current user"""
    agents = db.query(AIAgent).filter(AIAgent.user_id == current_user.id).all()
    return agents

@router.get("/{agent_id}", response_model=AIAgentResponse)
def get_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific agent details"""
    agent = db.query(AIAgent).filter(
        AIAgent.id == agent_id,
        AIAgent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return agent

@router.put("/{agent_id}", response_model=AIAgentResponse)
def update_agent(
    agent_id: int,
    agent_data: AIAgentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update agent configuration"""
    agent = db.query(AIAgent).filter(
        AIAgent.id == agent_id,
        AIAgent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    update_data = agent_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(agent, key, value)
    
    db.commit()
    db.refresh(agent)
    
    return agent

@router.post("/{agent_id}/pause")
def pause_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pause an agent"""
    agent = db.query(AIAgent).filter(
        AIAgent.id == agent_id,
        AIAgent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent.status = "paused"
    db.commit()
    
    return {"message": f"Agent {agent.name} paused"}

@router.post("/{agent_id}/resume")
def resume_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resume a paused agent"""
    agent = db.query(AIAgent).filter(
        AIAgent.id == agent_id,
        AIAgent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent.status = "active"
    db.commit()
    
    return {"message": f"Agent {agent.name} resumed"}

@router.post("/{agent_id}/run-now")
def run_agent_now(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger immediate agent run"""
    agent = db.query(AIAgent).filter(
        AIAgent.id == agent_id,
        AIAgent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Create activity log
    activity = AgentActivity(
        agent_id=agent.id,
        user_id=current_user.id,
        activity_type=agent.agent_type,
        status="running",
        started_at=datetime.utcnow()
    )
    
    db.add(activity)
    db.flush()
    
    # Trigger n8n workflow if it exists
    if agent.n8n_workflow_id:
        try:
            webhook_result = asyncio.run(n8n_client.trigger_workflow(
                workflow_id=agent.n8n_workflow_id,
                data={
                    "agent_id": agent.id,
                    "activity_id": activity.id,
                    "user_id": current_user.id,
                    "agent_type": agent.agent_type,
                    "configuration": agent.configuration
                }
            ))
            
            if webhook_result.get("success"):
                activity.status = "queued"
            else:
                activity.status = "failed"
                activity.error_log = webhook_result.get("error", "Unknown error")
        except Exception as e:
            activity.status = "failed"
            activity.error_log = str(e)
    else:
        activity.status = "pending"
    
    agent.last_run = datetime.utcnow()
    db.commit()
    
    return {
        "message": f"Agent {agent.name} triggered",
        "activity_id": activity.id,
        "status": activity.status
    }

@router.delete("/{agent_id}")
def delete_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an agent"""
    agent = db.query(AIAgent).filter(
        AIAgent.id == agent_id,
        AIAgent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Delete workflow from n8n if it exists
    if agent.n8n_workflow_id:
        try:
            asyncio.run(n8n_client.delete_workflow(agent.n8n_workflow_id))
        except Exception as e:
            print(f"Warning: Could not delete n8n workflow: {str(e)}")
    
    db.delete(agent)
    db.commit()
    
    return {"message": "Agent deleted"}

@router.get("/{agent_id}/activities", response_model=List[AgentActivityResponse])
def get_agent_activities(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Get activity log for an agent"""
    agent = db.query(AIAgent).filter(
        AIAgent.id == agent_id,
        AIAgent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    activities = db.query(AgentActivity).filter(
        AgentActivity.agent_id == agent_id
    ).order_by(AgentActivity.created_at.desc()).limit(limit).all()
    
    return activities
