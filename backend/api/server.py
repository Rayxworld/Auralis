"""
FastAPI server for Auralis.
Provides REST API endpoints for the frontend dashboard.
"""

import sys
import os

# Add backend folder to sys.path so relative imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from world.world import World
from agents.agent import SimpleAgent, CautiousAgent, AggressiveAgent, TrendFollowerAgent

import json
import asyncio
from typing import List, Dict, Any

app = FastAPI(title="Auralis API", version="1.0.0")

# CORS middleware for frontend (allows localhost access)
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
    'step_delay': 1.0  # seconds between auto steps
}

# Active WebSocket connections
active_connections: List[WebSocket] = []


async def broadcast_update(data: Dict[str, Any]):
    """Broadcast updates to all connected WebSocket clients safely."""
    # Make a copy to avoid modification during iteration
    for connection in active_connections[:]:
        try:
            await connection.send_json(data)
        except Exception:
            # Safely remove only if still present
            if connection in active_connections:
                active_connections.remove(connection)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Auralis API Server", "status": "running"}


@app.post("/simulation/create")
async def create_simulation(config: Dict[str, Any] = None):
    if config is None:
        config = {}

    world = World(initial_state={
        'resources': 1000,
        'market_price': 100,
        'volatility': 0.1
    })

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
    if simulation_state['world'] is None:
        return {"error": "No simulation created. Call /simulation/create first"}

    simulation_state['running'] = True
    asyncio.create_task(auto_step())

    return {"status": "started", "time": simulation_state['world'].time}


@app.post("/simulation/stop")
async def stop_simulation():
    simulation_state['running'] = False
    return {"status": "stopped", "time": simulation_state['world'].time if simulation_state['world'] else 0}


@app.post("/simulation/step")
async def step_simulation(steps: int = 1):
    if simulation_state['world'] is None:
        return {"error": "No simulation created"}

    world = simulation_state['world']
    results = []

    for _ in range(steps):
        step_actions = world.step()
        result_data = {
            'time': world.time,
            'state': world.get_public_state(),
            'actions': step_actions
        }
        results.append(result_data)

        # Broadcast safely
        try:
            await broadcast_update({
                'type': 'step',
                'data': result_data
            })
        except Exception as e:
            print(f"Broadcast failed during step: {e}")

    return {
        "status": "success",
        "steps_executed": steps,
        "results": results
    }


@app.get("/simulation/state")
async def get_state():
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
    if simulation_state['world'] is None:
        return {"error": "No simulation created"}

    world = simulation_state['world']
    agents_data = []

    for agent in world.agents:
        portfolio_value = agent.balance + (agent.holdings * world.state['market_price'])
        agents_data.append({
            **agent.to_dict(),
            'portfolio_value': portfolio_value,
            'profit_loss': portfolio_value - 100  # relative to initial 100
        })

    return {"agents": agents_data}


@app.get("/simulation/events")
async def get_events(limit: int = 50):
    if simulation_state['world'] is None:
        return {"error": "No simulation created"}

    world = simulation_state['world']
    events = world.events[-limit:]

    return {"events": events, "total": len(world.events)}


@app.get("/simulation/history")
async def get_history():
    if simulation_state['world'] is None:
        return {"error": "No simulation created"}

    world = simulation_state['world']
    return {
        "history": world.history,
        "total_steps": world.time
    }


@app.post("/simulation/reset")
async def reset_simulation():
    simulation_state['world'] = None
    simulation_state['running'] = False
    return {"status": "reset"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        if websocket in active_connections:
            active_connections.remove(websocket)


async def auto_step():
    """Background task to automatically step the simulation."""
    while simulation_state['running']:
        if simulation_state['world']:
            world = simulation_state['world']
            step_actions = world.step()

            data = {
                'type': 'auto_step',
                'data': {
                    'time': world.time,
                    'state': world.get_public_state(),
                    'actions': step_actions
                }
            }

            # Broadcast safely
            try:
                await broadcast_update(data)
            except Exception as e:
                print(f"Auto-step broadcast failed (likely closed connection): {e}")

        await asyncio.sleep(simulation_state['step_delay'])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)