"""
FastAPI server for Auralis.
Provides REST API endpoints for the frontend dashboard.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from world.world import World
from agents.agent import SimpleAgent, CautiousAgent, AggressiveAgent, TrendFollowerAgent
import json
import asyncio
from typing import List, Dict, Any

app = FastAPI(title="Auralis API", version="1.0.0")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global simulation state
simulation_state = {
    'world': None,
    'running': False,
    'step_delay': 1.0  # seconds between steps
}

# WebSocket connections for real-time updates
active_connections: List[WebSocket] = []


async def broadcast_update(data: Dict[str, Any]):
    """Broadcast updates to all connected WebSocket clients."""
    for connection in active_connections:
        try:
            await connection.send_json(data)
        except:
            active_connections.remove(connection)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Auralis API Server", "status": "running"}


@app.post("/simulation/create")
async def create_simulation(config: Dict[str, Any] = None):
    """
    Create a new simulation world with agents.
    
    Body:
    {
        "num_agents": 5,
        "agent_types": ["cautious", "aggressive", "trend"],
        "initial_balance": 100
    }
    """
    if config is None:
        config = {}
    
    # Create world
    world = World(initial_state={
        'resources': 1000,
        'market_price': 100,
        'volatility': 0.1
    })
    
    # Create agents based on config
    num_agents = config.get('num_agents', 5)
    agent_types = config.get('agent_types', ['cautious', 'aggressive', 'trend'])
    initial_balance = config.get('initial_balance', 100)
    
    agent_classes = {
        'simple': SimpleAgent,
        'cautious': CautiousAgent,
        'aggressive': AggressiveAgent,
        'trend': TrendFollowerAgent
    }
    
    created_agents = []
    for i in range(num_agents):
        agent_type = agent_types[i % len(agent_types)]
        agent_class = agent_classes.get(agent_type, SimpleAgent)
        
        agent = agent_class(f"{agent_type.capitalize()}-{i+1}", initial_balance=initial_balance)
        world.register_agent(agent)
        created_agents.append(agent.to_dict())
    
    simulation_state['world'] = world
    simulation_state['running'] = False
    
    return {
        "status": "created",
        "world": world.get_public_state(),
        "agents": created_agents
    }


@app.post("/simulation/start")
async def start_simulation():
    """Start the simulation (continuous stepping)."""
    if simulation_state['world'] is None:
        return {"error": "No simulation created. Call /simulation/create first"}
    
    simulation_state['running'] = True
    
    # Start background task for stepping
    asyncio.create_task(auto_step())
    
    return {"status": "started", "time": simulation_state['world'].time}


@app.post("/simulation/stop")
async def stop_simulation():
    """Stop the simulation."""
    simulation_state['running'] = False
    
    return {"status": "stopped", "time": simulation_state['world'].time if simulation_state['world'] else 0}


@app.post("/simulation/step")
async def step_simulation(steps: int = 1):
    """
    Execute n steps of the simulation manually.
    """
    if simulation_state['world'] is None:
        return {"error": "No simulation created"}
    
    world = simulation_state['world']
    results = []
    
    for _ in range(steps):
        step_actions = world.step()
        results.append({
            'time': world.time,
            'state': world.get_public_state(),
            'actions': step_actions
        })
        
        # Broadcast to WebSocket clients
        await broadcast_update({
            'type': 'step',
            'data': results[-1]
        })
    
    return {
        "status": "success",
        "steps_executed": steps,
        "results": results
    }


@app.get("/simulation/state")
async def get_state():
    """Get current simulation state."""
    if simulation_state['world'] is None:
        return {"error": "No simulation created"}
    
    world = simulation_state['world']
    
    return {
        "time": world.time,
        "state": world.get_public_state(),
        "agents": [agent.to_dict() for agent in world.agents],
        "running": simulation_state['running']
    }


@app.get("/simulation/agents")
async def get_agents():
    """Get all agent states."""
    if simulation_state['world'] is None:
        return {"error": "No simulation created"}
    
    world = simulation_state['world']
    
    agents_data = []
    for agent in world.agents:
        portfolio_value = agent.balance + (agent.holdings * world.state['market_price'])
        agents_data.append({
            **agent.to_dict(),
            'portfolio_value': portfolio_value,
            'profit_loss': portfolio_value - 100  # Assuming initial balance 100
        })
    
    return {"agents": agents_data}


@app.get("/simulation/events")
async def get_events(limit: int = 50):
    """Get recent events."""
    if simulation_state['world'] is None:
        return {"error": "No simulation created"}
    
    world = simulation_state['world']
    events = world.events[-limit:]
    
    return {"events": events, "total": len(world.events)}


@app.get("/simulation/history")
async def get_history():
    """Get complete simulation history."""
    if simulation_state['world'] is None:
        return {"error": "No simulation created"}
    
    world = simulation_state['world']
    
    return {
        "history": world.history,
        "total_steps": world.time
    }


@app.post("/simulation/reset")
async def reset_simulation():
    """Reset the simulation."""
    simulation_state['world'] = None
    simulation_state['running'] = False
    
    return {"status": "reset"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            
            # Echo back or handle commands
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        active_connections.remove(websocket)


async def auto_step():
    """Background task to automatically step the simulation."""
    while simulation_state['running']:
        if simulation_state['world']:
            world = simulation_state['world']
            step_actions = world.step()
            
            # Broadcast update
            await broadcast_update({
                'type': 'auto_step',
                'data': {
                    'time': world.time,
                    'state': world.get_public_state(),
                    'actions': step_actions
                }
            })
        
        await asyncio.sleep(simulation_state['step_delay'])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)