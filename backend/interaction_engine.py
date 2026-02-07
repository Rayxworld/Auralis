"""
Agent Interaction System
Handles trading, alliances, resources, and agent-to-agent actions
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class ActionType(Enum):
    TRADE = "trade"
    FORM_ALLIANCE = "form_alliance"
    BREAK_ALLIANCE = "break_alliance"
    TRANSFER_RESOURCE = "transfer_resource"
    ATTACK = "attack"
    SHARE_INFO = "share_info"

@dataclass
class Alliance:
    """Alliance between agents"""
    alliance_id: str
    members: List[str]
    shared_resources: Dict[str, float]
    created_at: int
    

class InteractionEngine:
    """Manages agent-to-agent interactions"""
    
    def __init__(self):
        self.alliances: Dict[str, Alliance] = {}
        self.trades: List[Dict] = []
        self.resources: Dict[str, Dict[str, float]] = {}  # agent_id -> {resource -> amount}
        
    def initialize_agent_resources(self, agent_id: str):
        """Initialize resources for a new agent"""
        self.resources[agent_id] = {
            'materials': 100.0,
            'energy': 100.0,
            'information': 50.0
        }
    
    def execute_trade(
        self,
        agent_a: str,
        agent_b: str,
        offer: Dict[str, float],
        request: Dict[str, float]
    ) -> bool:
        """Execute trade between two agents"""
        
        # Verify agent A has offered resources
        if agent_a not in self.resources:
            return False
            
        for resource, amount in offer.items():
            if self.resources[agent_a].get(resource, 0) < amount:
                return False
        
        # Verify agent B has requested resources
        if agent_b not in self.resources:
            return False
            
        for resource, amount in request.items():
            if self.resources[agent_b].get(resource, 0) < amount:
                return False
        
        # Execute trade
        for resource, amount in offer.items():
            self.resources[agent_a][resource] -= amount
            self.resources[agent_b][resource] = self.resources[agent_b].get(resource, 0) + amount
        
        for resource, amount in request.items():
            self.resources[agent_b][resource] -= amount
            self.resources[agent_a][resource] = self.resources[agent_a].get(resource, 0) + amount
        
        # Log trade
        self.trades.append({
            'agent_a': agent_a,
            'agent_b': agent_b,
            'offer': offer,
            'request': request,
            'timestamp': len(self.trades)
        })
        
        return True
    
    def form_alliance(self, agent_ids: List[str]) -> str:
        """Form an alliance between agents"""
        import uuid
        alliance_id = str(uuid.uuid4())[:8]
        
        alliance = Alliance(
            alliance_id=alliance_id,
            members=agent_ids,
            shared_resources={},
            created_at=len(self.alliances)
        )
        
        self.alliances[alliance_id] = alliance
        return alliance_id
    
    def get_alliance(self, agent_id: str) -> Optional[Alliance]:
        """Get alliance that agent belongs to"""
        for alliance in self.alliances.values():
            if agent_id in alliance.members:
                return alliance
        return None
    
    def break_alliance(self, alliance_id: str) -> bool:
        """Dissolve an alliance"""
        if alliance_id in self.alliances:
            del self.alliances[alliance_id]
            return True
        return False
    
    def get_agent_resources(self, agent_id: str) -> Dict[str, float]:
        """Get agent's current resources"""
        return self.resources.get(agent_id, {})
    
    def transfer_resources(
        self,
        from_agent: str,
        to_agent: str,
        resources: Dict[str, float]
    ) -> bool:
        """Transfer resources from one agent to another"""
        
        if from_agent not in self.resources:
            return False
            
        # Verify sender has resources
        for resource, amount in resources.items():
            if self.resources[from_agent].get(resource, 0) < amount:
                return False
        
        # Transfer
        if to_agent not in self.resources:
            self.initialize_agent_resources(to_agent)
            
        for resource, amount in resources.items():
            self.resources[from_agent][resource] -= amount
            self.resources[to_agent][resource] = self.resources[to_agent].get(resource, 0) + amount
        
        return True
    
    def get_trade_history(self, agent_id: str) -> List[Dict]:
        """Get trade history for an agent"""
        return [
            trade for trade in self.trades
            if trade['agent_a'] == agent_id or trade['agent_b'] == agent_id
        ]


# Global interaction engine
interaction_engine = InteractionEngine()
