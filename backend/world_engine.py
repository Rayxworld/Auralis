"""
Multi-World System for Auralis
Supports multiple parallel simulation worlds with independent economies
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import uuid

@dataclass
class WorldConfig:
    """Configuration for a simulation world"""
    world_id: str
    name: str
    creator: str
    entry_fee: float  # In MON tokens
    max_agents: int = 100
    rules: Dict = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
@dataclass
class WorldState:
    """State of a simulation world"""
    world_id: str
    time: int = 0
    market_price: float = 100.0
    volatility: float = 0.02
    resources: int = 1000
    active_agents: List[str] = field(default_factory=list)
    total_volume: float = 0.0
    events: List[Dict] = field(default_factory=list)


class MultiWorldEngine:
    """Manages multiple parallel simulation worlds"""
    
    def __init__(self):
        self.worlds: Dict[str, dict] = {}  # world_id -> {config, state, simulation}
        
    def create_world(
        self,
        name: str,
        creator: str,
        entry_fee: float,
        max_agents: int = 100,
        rules: Optional[Dict] = None,
        world_id: Optional[str] = None
    ) -> str:
        """Create a new simulation world"""
        world_id = world_id or str(uuid.uuid4())[:8]
        
        config = WorldConfig(
            world_id=world_id,
            name=name,
            creator=creator,
            entry_fee=entry_fee,
            max_agents=max_agents,
            rules=rules or {}
        )
        
        state = WorldState(world_id=world_id)
        
        self.worlds[world_id] = {
            'config': config,
            'state': state,
            'simulation': None,  # Will be initialized when first agent enters
            'running': False
        }
        
        return world_id
    
    def get_world(self, world_id: str) -> Optional[dict]:
        """Get world by ID"""
        return self.worlds.get(world_id)
    
    def list_worlds(self) -> List[dict]:
        """List all available worlds"""
        return [
            {
                'world_id': w['config'].world_id,
                'name': w['config'].name,
                'creator': w['config'].creator,
                'entry_fee': w['config'].entry_fee,
                'max_agents': w['config'].max_agents,
                'active_agents': len(w['state'].active_agents),
                'running': w['running'],
                'created_at': w['config'].created_at
            }
            for w in self.worlds.values()
        ]
    
    def agent_enter_world(self, world_id: str, agent_id: str) -> bool:
        """Add agent to a world"""
        world = self.worlds.get(world_id)
        if not world:
            return False
            
        state = world['state']
        config = world['config']
        
        if len(state.active_agents) >= config.max_agents:
            return False
            
        if agent_id not in state.active_agents:
            state.active_agents.append(agent_id)
            state.events.append({
                'type': 'agent_joined',
                'agent_id': agent_id,
                'time': state.time
            })
            
        return True
    
    def get_world_state(self, world_id: str) -> Optional[Dict]:
        """Get current state of a world"""
        world = self.worlds.get(world_id)
        if not world:
            return None
            
        state = world['state']
        return {
            'world_id': world_id,
            'time': state.time,
            'market_price': state.market_price,
            'volatility': state.volatility,
            'resources': state.resources,
            'active_agents': len(state.active_agents),
            'total_volume': state.total_volume,
            'recent_events': state.events[-10:]  # Last 10 events
        }
    
    def step_world(self, world_id: str):
        """Advance world simulation by one step"""
        world = self.worlds.get(world_id)
        if not world or not world['simulation']:
            return
            
        # Step the simulation
        world['simulation'].step()
        
        # Update world state
        sim_world = world['simulation']
        state = world['state']
        state.time = sim_world.time
        state.market_price = sim_world.state['market_price']
        state.volatility = sim_world.state['volatility']
        state.resources = sim_world.state.get('resources', 1000)
        state.total_volume = getattr(sim_world, 'total_volume', 0.0)
    
    def delete_world(self, world_id: str) -> bool:
        """Delete a world"""
        if world_id in self.worlds:
            del self.worlds[world_id]
            return True
        return False


# Global world engine instance
world_engine = MultiWorldEngine()
