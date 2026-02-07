"""
FastAPI server for Auralis.
Provides REST API endpoints for the multi-world simulation platform.
"""

import sys
import os

# Add backend folder to sys.path so relative imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from world.world import World
from agents.agent import SimpleAgent, CautiousAgent, AggressiveAgent, TrendFollowerAgent
from world_engine import world_engine
from interaction_engine import interaction_engine

import json
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

app = FastAPI(title="Auralis API", version="2.0.0")

# CORS middleware for frontend (allows localhost access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections
active_connections: List[WebSocket] = []

class WorldCreate(BaseModel):
    name: str
    creator: str
    entry_fee: float
    max_agents: Optional[int] = 100
    config: Optional[Dict[str, Any]] = None

async def broadcast_update(data: Dict[str, Any]):
    """Broadcast updates to all connected WebSocket clients safely."""
    for connection in active_connections[:]:
        try:
            await connection.send_json(data)
        except Exception:
            if connection in active_connections:
                active_connections.remove(connection)

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Auralis Multi-World API Server", "status": "running"}

# --- World Management ---

@app.post("/worlds/create")
async def create_world(data: WorldCreate):
    world_id = world_engine.create_world(
        name=data.name,
        creator=data.creator,
        entry_fee=data.entry_fee,
        max_agents=data.max_agents,
        rules=data.config
    )
    
    # Initialize simulation for this world
    world = World(initial_state={
        'resources': 1000,
        'market_price': 100,
        'volatility': 0.1,
        **(data.config or {})
    })
    
    world_data = world_engine.get_world(world_id)
    world_data['simulation'] = world
    
    return {"world_id": world_id, "status": "created"}

@app.get("/worlds")
async def list_worlds():
    return {"worlds": world_engine.list_worlds()}

@app.get("/worlds/{world_id}")
async def get_world_details(world_id: str):
    world = world_engine.get_world(world_id)
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
    
    return {
        "config": world['config'],
        "state": world_engine.get_world_state(world_id),
        "running": world['running']
    }

# --- Simulation Control ---

@app.post("/worlds/{world_id}/start")
async def start_world_simulation(world_id: str):
    world = world_engine.get_world(world_id)
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
    
    if not world['running']:
        world['running'] = True
        asyncio.create_task(run_world_simulation(world_id))
    
    return {"status": "started", "world_id": world_id}

@app.post("/worlds/{world_id}/stop")
async def stop_world_simulation(world_id: str):
    world = world_engine.get_world(world_id)
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
    
    world['running'] = False
    return {"status": "stopped", "world_id": world_id}

# --- Agent Interaction ---

@app.post("/worlds/{world_id}/join")
async def join_world(world_id: str, agent_data: Dict[str, Any]):
    world = world_engine.get_world(world_id)
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
        
    agent_id = agent_data.get('name')
    if not agent_id:
        raise HTTPException(status_code=400, detail="Agent name required")
        
    success = world_engine.agent_enter_world(world_id, agent_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to join world (likely full)")
        
    # Register agent in actual simulation if not exists
    sim = world['simulation']
    if not any(a.name == agent_id for a in sim.agents):
        agent_type = agent_data.get('type', 'simple')
        agent_classes = {
            'simple': SimpleAgent,
            'cautious': CautiousAgent,
            'aggressive': AggressiveAgent,
            'trend': TrendFollowerAgent
        }
        agent_class = agent_classes.get(agent_type, SimpleAgent)
        agent = agent_class(agent_id, initial_balance=agent_data.get('balance', 100))
        sim.register_agent(agent)
        interaction_engine.initialize_agent_resources(agent_id)
        
    return {"status": "joined", "agent_id": agent_id}

@app.get("/worlds/{world_id}/agents")
async def get_world_agents(world_id: str):
    world = world_engine.get_world(world_id)
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
        
    sim = world['simulation']
    agents_data = []
    
    for agent in sim.agents:
        portfolio_value = agent.balance + (agent.holdings * sim.state['market_price'])
        agents_data.append({
            **agent.to_dict(),
            'portfolio_value': portfolio_value,
            'profit_loss': portfolio_value - 100,
            'resources': interaction_engine.get_agent_resources(agent.name)
        })
        
    return {"agents": agents_data}

# --- WebSocket ---

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

# --- Background Tasks ---

async def run_world_simulation(world_id: str):
    """Background task to run a specific world's simulation."""
    while True:
        world = world_engine.get_world(world_id)
        if not world or not world['running']:
            break
            
        sim = world['simulation']
        # Advance the world engine state
        # This already calls sim.step() and updates state
        world_engine.step_world(world_id)
        
        data = {
            'type': 'world_update',
            'world_id': world_id,
            'data': {
                'time': sim.time,
                'state': sim.get_public_state(),
                'agents': [a.name for a in sim.agents]
            }
        }
        
        await broadcast_update(data)
        await asyncio.sleep(1.0) # 1 second delay between steps

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting Auralis Backend v1.1.0...")
    
    # Create a default "Genesis" world for immediate testing
    print("🌍 Initializing Genesis World...")
    genesis_id = world_engine.create_world(
        name="Genesis",
        creator="Auralis",
        entry_fee=10.0,
        max_agents=50,
        rules={'market_price': 150.0},
        world_id="genesis"
    )
    
    world = World(initial_state={
        'resources': 1000,
        'market_price': 150.0,
        'volatility': 0.05
    })
    
    world_data = world_engine.get_world(genesis_id)
    world_data['simulation'] = world
    world_data['running'] = True
    
    # Start the simulation task for Genesis
    loop = asyncio.get_event_loop()
    loop.create_task(run_world_simulation(genesis_id))
    
    print(f"✅ Genesis World ready at ID: {genesis_id}")

    # --- Seed Fake Agents ---
    print("🤖 Seeding simulation with synthetic agents...")
    fake_agents = [
        "0xSatoshi", "GweiLord", "VitalikFan", "DeFi_Wizard", 
        "BlockNinja", "HodlGang", "MoonWalker", "YieldFarmer", 
        "CipherPunk", "AlphaSeeker"
    ]
    
    sim = world_data['simulation']
    import random
    
    for name in fake_agents:
        # Create agent logic
        agent = SimpleAgent(name, initial_balance=random.randint(50, 500))
        # Register in simulation
        sim.register_agent(agent)
        # Add some initial random holdings
        agent.holdings = random.uniform(0.1, 5.0)
        interaction_engine.initialize_agent_resources(name)
        print(f"   + Agent joined: {name}")

    print(f"✅ Seeding complete. {len(fake_agents)} agents active.")

    # --- Background Random Joining ---
    async def simulate_traffic():
        """Simulate random agents joining over time"""
        extra_names = [
            "ThetaWhale", "GammaRay", "DeltaForce", "EpsilonEdge", 
            "ZetaZone", "EtaEffect", "IotaImpulse", "KappaKing",
            "LambdaLink", "MuMomentum", "NuNetwork", "XiXplorer",
            "OmicronOrb", "PiPilot", "RhoRider", "SigmaSurfer"
        ]
        
        while True:
            await asyncio.sleep(random.randint(10, 30)) # Wait 10-30 seconds
            
            # Check if we can add more agents
            world = world_engine.get_world("genesis")
            if world and len(world['state'].active_agents) < world['config'].max_agents:
                new_name = random.choice(extra_names) + f"_{random.randint(100, 999)}"
                agent = SimpleAgent(new_name, initial_balance=random.randint(50, 500))
                world['simulation'].register_agent(agent)
                agent.holdings = random.uniform(0.1, 5.0)
                interaction_engine.initialize_agent_resources(new_name)
                print(f"   🤖 [Auto-Join] {new_name} entered the simulation.")

    loop.create_task(simulate_traffic())

    uvicorn.run(app, host="0.0.0.0", port=8000)
