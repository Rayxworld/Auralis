"""
World simulation engine for Auralis.
Manages time progression, agent registration, and event resolution.
"""

import json
from typing import List, Dict, Any
from datetime import datetime


class World:
    """
    The World represents the shared environment where agents exist and interact.
    """
    
    def __init__(self, initial_state: Dict[str, Any] = None):
        self.time = 0
        self.agents = []
        self.events = []
        self.state = initial_state or {
            'resources': 1000,
            'market_price': 100,
            'volatility': 0.1
        }
        self.history = []
        
    def register_agent(self, agent):
        """Register an agent in the world."""
        self.agents.append(agent)
        self.events.append({
            'time': self.time,
            'type': 'agent_joined',
            'agent': agent.name,
            'details': f'{agent.name} joined the simulation'
        })
        
    def step(self):
        """
        Execute one time step:
        1. Update world state
        2. Let agents observe
        3. Let agents decide and act
        4. Resolve actions
        5. Record history
        """
        self.time += 1
        
        # Update world state (simulate market dynamics)
        self._update_world_state()
        
        # Each agent observes, decides, and acts
        step_actions = []
        for agent in self.agents:
            # Agent observes the world
            observation = agent.observe(self)
            
            # Agent makes a decision based on observation
            action = agent.decide(self)
            
            # Resolve the action
            if action:
                result = self._resolve_action(action)
                step_actions.append({
                    'agent': agent.name,
                    'action': action,
                    'result': result
                })
                
                # Agent learns from the result
                agent.learn(action, result)
        
        # Record this step in history
        self.history.append({
            'time': self.time,
            'state': self.state.copy(),
            'actions': step_actions
        })
        
        return step_actions
    
    def _update_world_state(self):
        """Update world state each step (market dynamics, resources, etc.)"""
        import random
        
        # Simulate market price changes
        change = random.gauss(0, self.state['volatility'])
        self.state['market_price'] *= (1 + change)
        self.state['market_price'] = max(10, self.state['market_price'])  # Floor price
        
        # Adjust volatility based on agent activity
        recent_actions = len(self.events[-10:]) if len(self.events) > 10 else len(self.events)
        self.state['volatility'] = 0.05 + (recent_actions * 0.01)
        
    def _resolve_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resolve an agent action and update world state.
        Returns the result of the action.
        """
        agent_name = action['agent']
        action_type = action['type']
        
        # Find the agent
        agent = next((a for a in self.agents if a.name == agent_name), None)
        if not agent:
            return {'success': False, 'reason': 'Agent not found'}
        
        # Action fee
        action_fee = 1
        if agent.balance < action_fee:
            return {'success': False, 'reason': 'Insufficient balance'}
        
        agent.balance -= action_fee
        
        result = {'success': True, 'cost': action_fee}
        
        # Handle different action types
        if action_type == 'observe':
            result['observation'] = self.get_public_state()
            
        elif action_type == 'trade':
            amount = action.get('amount', 0)
            direction = action.get('direction', 'buy')  # buy or sell
            
            if direction == 'buy' and agent.balance >= amount:
                agent.balance -= amount
                agent.holdings += amount / self.state['market_price']
                result['holdings'] = agent.holdings
                result['price'] = self.state['market_price']
                
            elif direction == 'sell' and agent.holdings > 0:
                sell_amount = min(amount, agent.holdings)
                agent.holdings -= sell_amount
                agent.balance += sell_amount * self.state['market_price']
                result['holdings'] = agent.holdings
                result['balance'] = agent.balance
                
        elif action_type == 'predict':
            prediction = action.get('prediction', {})
            result['prediction'] = prediction
            
        elif action_type == 'communicate':
            message = action.get('message', '')
            target = action.get('target', 'all')
            result['message'] = message
            result['target'] = target
            
            # Broadcast message event
            self.events.append({
                'time': self.time,
                'type': 'communication',
                'from': agent_name,
                'to': target,
                'message': message
            })
        
        # Log the event
        self.events.append({
            'time': self.time,
            'type': action_type,
            'agent': agent_name,
            'action': action,
            'result': result
        })
        
        return result
    
    def get_public_state(self) -> Dict[str, Any]:
        """Get publicly observable world state."""
        return {
            'time': self.time,
            'market_price': self.state['market_price'],
            'volatility': self.state['volatility'],
            'resources': self.state['resources'],
            'num_agents': len(self.agents),
            'recent_events': self.events[-5:]
        }
    
    def get_full_state(self) -> Dict[str, Any]:
        """Get complete world state (for serialization/debugging)."""
        return {
            'time': self.time,
            'state': self.state,
            'agents': [a.to_dict() for a in self.agents],
            'events': self.events,
            'history': self.history
        }
    
    def save_state(self, filepath: str):
        """Save world state to file."""
        with open(filepath, 'w') as f:
            json.dump(self.get_full_state(), f, indent=2)
    
    def load_state(self, filepath: str):
        """Load world state from file."""
        with open(filepath, 'r') as f:
            data = json.load(f)
            self.time = data['time']
            self.state = data['state']
            self.events = data['events']
            self.history = data['history']