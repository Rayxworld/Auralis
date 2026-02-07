"""
Base Agent class for Auralis.
All agents follow the observe → predict → decide → act → learn loop.
"""

import random
from typing import Dict, Any, List
from abc import ABC, abstractmethod


class Agent(ABC):
    """
    Base class for all agents in Auralis.
    Each agent has a name, personality, memory, balance, and decision-making logic.
    """

    def __init__(self, name: str, personality: Dict[str, Any] = None, initial_balance: float = 100):
        self.name = name
        self.personality = personality or {}
        self.memory = []
        self.balance = initial_balance
        self.holdings = 0
        self.predictions = []
        self.action_count = 0

    def observe(self, world) -> Dict[str, Any]:
        """
        OBSERVE: Agent observes the world state.
        Returns what the agent can see.
        """
        observation = world.get_public_state()

        # Store observation in memory
        self.memory.append({
            'time': world.time,
            'type': 'observation',
            'data': observation
        })

        # Keep memory limited (last 50 observations)
        if len(self.memory) > 50:
            self.memory = self.memory[-50:]

        return observation

    @abstractmethod
    def predict(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        """
        PREDICT: Agent makes predictions about future states.
        This should be implemented by each agent type.
        """
        pass

    @abstractmethod
    def decide(self, world) -> Dict[str, Any]:
        """
        DECIDE: Agent decides what action to take based on observations and predictions.
        Returns an action dict with 'type', 'agent', and action-specific parameters.
        This should be implemented by each agent type.
        """
        pass

    def learn(self, action: Dict[str, Any], result: Dict[str, Any]):
        """
        LEARN: Agent learns from the result of its action.
        Updates internal state based on outcomes.
        """
        self.action_count += 1

        # Store action-result pair in memory
        self.memory.append({
            'type': 'action_result',
            'action': action,
            'result': result
        })

        # Simple learning: track success rate
        if not hasattr(self, 'success_count'):
            self.success_count = 0

        if result.get('success', False):
            self.success_count += 1

    def get_success_rate(self) -> float:
        """Calculate the agent's success rate."""
        if self.action_count == 0:
            return 0.0
        return self.success_count / self.action_count

    def to_dict(self) -> Dict[str, Any]:
        """Serialize agent state to dictionary."""
        return {
            'name': self.name,
            'personality': self.personality,
            'balance': self.balance,
            'holdings': self.holdings,
            'action_count': self.action_count,
            'success_rate': self.get_success_rate(),
            'memory_size': len(self.memory)
        }


class SimpleAgent(Agent):
    """
    A simple agent that observes and takes random actions.
    Good for testing the simulation.
    """

    def predict(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        """Simple random prediction."""
        return {
            'price_direction': random.choice(['up', 'down', 'stable']),
            'confidence': random.random()
        }

    def decide(self, world) -> Dict[str, Any]:
        """Make a simple random decision."""
        observation = self.observe(world)
        prediction = self.predict(observation)

        # Random action type
        action_types = ['observe', 'trade', 'predict', 'communicate']
        action_type = random.choice(action_types)

        action = {
            'agent': self.name,
            'type': action_type,
            'time': world.time
        }

        if action_type == 'trade':
            action['direction'] = random.choice(['buy', 'sell'])
            action['amount'] = random.uniform(1, 10)

        elif action_type == 'predict':
            action['prediction'] = prediction

        elif action_type == 'communicate':
            action['message'] = f'{self.name} observed price: {observation.get("market_price", 0):.2f}'
            action['target'] = 'all'

        return action


class CautiousAgent(Agent):
    """
    A cautious agent that avoids risk and prefers stability.
    Only acts when confident.
    """

    def __init__(self, name: str, initial_balance: float = 100):
        personality = {
            'risk_tolerance': 0.2,
            'confidence_threshold': 0.7,
            'strategy': 'cautious'
        }
        super().__init__(name, personality, initial_balance)
        self.price_history = []

    def predict(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        """Predict based on price stability."""
        price = observation.get('market_price', 100)
        self.price_history.append(price)

        if len(self.price_history) > 10:
            self.price_history = self.price_history[-10:]

        # Calculate volatility
        if len(self.price_history) >= 3:
            avg = sum(self.price_history) / len(self.price_history)
            volatility = sum(abs(p - avg) for p in self.price_history) / len(self.price_history)

            # High volatility = low confidence
            confidence = max(0, 1 - (volatility / avg))
        else:
            confidence = 0.5

        return {
            'price_direction': 'stable',
            'confidence': confidence,
            'volatility': volatility if len(self.price_history) >= 3 else 0
        }

    def decide(self, world) -> Dict[str, Any]:
        """Only act when very confident and stable."""
        observation = self.observe(world)
        prediction = self.predict(observation)

        # Low confidence = just observe
        if prediction['confidence'] < self.personality['confidence_threshold']:
            return {
                'agent': self.name,
                'type': 'observe',
                'time': world.time
            }

        # High confidence + low volatility = maybe trade small amounts
        if prediction['volatility'] < 5:
            return {
                'agent': self.name,
                'type': 'trade',
                'direction': 'buy' if self.holdings == 0 else 'sell',
                'amount': 2,  # Small amounts only
                'time': world.time
            }

        return {
            'agent': self.name,
            'type': 'observe',
            'time': world.time
        }


class AggressiveAgent(Agent):
    """
    An aggressive agent that takes risks and makes frequent trades.
    Tries to profit from volatility.
    """

    def __init__(self, name: str, initial_balance: float = 100):
        personality = {
            'risk_tolerance': 0.9,
            'confidence_threshold': 0.3,
            'strategy': 'aggressive'
        }
        super().__init__(name, personality, initial_balance)
        self.price_history = []
        self.last_action = None

    def predict(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        """Predict based on momentum."""
        price = observation.get('market_price', 100)
        self.price_history.append(price)

        if len(self.price_history) > 5:
            self.price_history = self.price_history[-5:]

        # Momentum-based prediction
        if len(self.price_history) >= 2:
            if self.price_history[-1] > self.price_history[-2]:
                direction = 'up'
            else:
                direction = 'down'
        else:
            direction = 'stable'

        return {
            'price_direction': direction,
            'confidence': 0.8,  # Always confident
            'momentum': direction
        }

    def decide(self, world) -> Dict[str, Any]:
        """Trade aggressively based on momentum."""
        observation = self.observe(world)
        prediction = self.predict(observation)

        # Always try to trade
        if prediction['momentum'] == 'up' and self.balance > 10:
            return {
                'agent': self.name,
                'type': 'trade',
                'direction': 'buy',
                'amount': min(self.balance * 0.3, 20),  # Use 30% of balance
                'time': world.time
            }

        elif prediction['momentum'] == 'down' and self.holdings > 0:
            return {
                'agent': self.name,
                'type': 'trade',
                'direction': 'sell',
                'amount': self.holdings * 0.5,  # Sell half
                'time': world.time
            }

        # If can't trade, communicate
        return {
            'agent': self.name,
            'type': 'communicate',
            'message': f'Looking for trades! Momentum: {prediction["momentum"]}',
            'target': 'all',
            'time': world.time
        }


class TrendFollowerAgent(Agent):
    """
    An agent that follows trends and copies successful agents.
    """

    def __init__(self, name: str, initial_balance: float = 100):
        personality = {
            'risk_tolerance': 0.5,
            'confidence_threshold': 0.5,
            'strategy': 'trend_follower'
        }
        super().__init__(name, personality, initial_balance)
        self.trend_data = []

    def predict(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        """Follow the trend of recent events."""
        recent_events = observation.get('recent_events', [])

        # Count buy vs sell actions
        buys = sum(1 for e in recent_events if e.get('type') == 'trade' and
                   e.get('action', {}).get('direction') == 'buy')
        sells = sum(1 for e in recent_events if e.get('type') == 'trade' and
                    e.get('action', {}).get('direction') == 'sell')

        if buys > sells:
            trend = 'bullish'
        elif sells > buys:
            trend = 'bearish'
        else:
            trend = 'neutral'

        return {
            'trend': trend,
            'confidence': 0.6,
            'following': 'market'
        }

    def decide(self, world) -> Dict[str, Any]:
        """Follow the trend."""
        observation = self.observe(world)
        prediction = self.predict(observation)

        trend = prediction['trend']

        if trend == 'bullish' and self.balance > 5:
            return {
                'agent': self.name,
                'type': 'trade',
                'direction': 'buy',
                'amount': min(self.balance * 0.2, 10),
                'time': world.time
            }

        elif trend == 'bearish' and self.holdings > 0:
            return {
                'agent': self.name,
                'type': 'trade',
                'direction': 'sell',
                'amount': self.holdings * 0.3,
                'time': world.time
            }

        return {
            'agent': self.name,
            'type': 'observe',
            'time': world.time
        }


class AIEnhancedAgent(Agent):
    """
    An AI-enhanced agent that uses local LLM (Ollama) for decision-making.
    Falls back to rule-based logic if AI is unavailable.
    """
    
    def __init__(self, name: str, personality: Dict[str, Any] = None, initial_balance: float = 100):
        if personality is None:
            personality = {
                'risk_tolerance': 0.6,
                'confidence_threshold': 0.5,
                'strategy': 'ai_enhanced'
            }
        
        super().__init__(name, personality, initial_balance)
        self.price_history = []
        
        # Try to import AI reasoner
        try:
            import sys
            import os
            sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            from ai_reasoner import get_ai_reasoner
            self.ai_reasoner = get_ai_reasoner()
            self.ai_available = self.ai_reasoner.available
        except Exception as e:
            print(f"⚠️  AI reasoner not available for {self.name}: {e}")
            self.ai_reasoner = None
            self.ai_available = False
    
    def predict(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        """Use AI to predict market movement if available."""
        price = observation.get('market_price', 100)
        self.price_history.append(price)
        
        if len(self.price_history) > 20:
            self.price_history = self.price_history[-20:]
        
        # Try AI prediction
        if self.ai_available and self.ai_reasoner:
            try:
                history = [{'market_price': p} for p in self.price_history]
                ai_prediction = self.ai_reasoner.predict_market(observation, history)
                
                if ai_prediction:
                    return ai_prediction
            except:
                pass
        
        # Fallback to rule-based prediction
        if len(self.price_history) >= 2:
            if self.price_history[-1] > self.price_history[-2]:
                direction = 'up'
            else:
                direction = 'down'
        else:
            direction = 'stable'
        
        return {
            'direction': direction,
            'confidence': 0.5,
            'magnitude': 0.1
        }
    
    def decide(self, world) -> Dict[str, Any]:
        """Use AI to decide action if available, otherwise use rules."""
        observation = self.observe(world)
        
        # Try AI decision
        if self.ai_available and self.ai_reasoner:
            try:
                # Build memory context
                memory_text = []
                for mem in self.memory[-10:]:
                    if mem['type'] == 'action_result':
                        action_type = mem['action'].get('type', 'unknown')
                        success = mem['result'].get('success', False)
                        memory_text.append(f"{action_type}: {'✓' if success else '✗'}")
                
                ai_action = self.ai_reasoner.reason_about_world(
                    self.personality,
                    observation,
                    memory_text
                )
                
                if ai_action:
                    # Convert AI action to world action format
                    action_type = ai_action.get('action', 'observe')
                    
                    action = {
                        'agent': self.name,
                        'type': action_type,
                        'time': world.time,
                        'ai_reasoning': ai_action.get('reasoning', ''),
                        'ai_confidence': ai_action.get('confidence', 0.5)
                    }
                    
                    if action_type == 'trade':
                        action['direction'] = ai_action.get('direction', 'buy')
                        action['amount'] = min(ai_action.get('amount', 5), self.balance * 0.3)
                    
                    elif action_type == 'communicate':
                        action['message'] = ai_action.get('reasoning', 'AI agent communicating')
                        action['target'] = 'all'
                    
                    return action
            except Exception as e:
                print(f"AI decision failed for {self.name}: {e}")
        
        # Fallback to rule-based decision
        prediction = self.predict(observation)
        
        if prediction['direction'] == 'up' and self.balance > 5:
            return {
                'agent': self.name,
                'type': 'trade',
                'direction': 'buy',
                'amount': min(self.balance * 0.2, 10),
                'time': world.time
            }
        
        elif prediction['direction'] == 'down' and self.holdings > 0:
            return {
                'agent': self.name,
                'type': 'trade',
                'direction': 'sell',
                'amount': self.holdings * 0.3,
                'time': world.time
            }
        
        return {
            'agent': self.name,
            'type': 'observe',
            'time': world.time
        }
