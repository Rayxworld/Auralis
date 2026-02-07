"""
AI Reasoner Module for Auralis
Uses local Ollama API for enhanced agent decision-making
"""

import requests
import json
from typing import Dict, Any, Optional


class AIReasoner:
    """Interface to local LLM (Ollama) for agent reasoning"""
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama2"):
        """
        Initialize AI Reasoner
        
        Args:
            base_url: Ollama API endpoint
            model: Model name to use (llama2, mistral, etc.)
        """
        self.base_url = base_url
        self.model = model
        self.available = self._check_availability()
        
    def _check_availability(self) -> bool:
        """Check if Ollama is running and accessible"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            print("⚠️  Ollama not available - agent will use rule-based logic")
            return False
    
    def reason_about_world(self, agent_personality: Dict, world_state: Dict, 
                          agent_memory: list) -> Optional[Dict]:
        """
        Use AI to reason about the world and suggest an action
        
        Args:
            agent_personality: Agent's personality traits
            world_state: Current world state
            agent_memory: Recent agent memories
            
        Returns:
            Suggested action dict or None if AI unavailable
        """
        if not self.available:
            return None
        
        prompt = self._build_reasoning_prompt(agent_personality, world_state, agent_memory)
        
        try:
            response = self._query_ollama(prompt)
            return self._parse_ai_response(response)
        except Exception as e:
            print(f"AI reasoning failed: {e}")
            return None
    
    def _build_reasoning_prompt(self, personality: Dict, world_state: Dict, 
                                memory: list) -> str:
        """Build structured prompt for AI reasoning"""
        
        strategy = personality.get('strategy', 'unknown')
        risk_tolerance = personality.get('risk_tolerance', 0.5)
        
        # Get recent events
        recent_events = memory[-5:] if len(memory) > 5 else memory
        events_str = '\n'.join([f"- {event}" for event in recent_events])
        
        prompt = f"""You are an AI agent in a multi-agent trading simulation. 

Your Personality:
- Strategy: {strategy}
- Risk Tolerance: {risk_tolerance} (0=cautious, 1=aggressive)

Current World State:
- Market Price: ${world_state.get('market_price', 0):.2f}
- Volatility: {world_state.get('volatility', 0):.2%}
- Time Step: {world_state.get('time', 0)}

Recent Events:
{events_str if events_str else 'None yet'}

Based on your personality and the world state, decide what action to take.

Respond with ONLY a JSON object in this exact format:
{{
    "action": "trade" or "observe" or "communicate",
    "reasoning": "brief explanation",
    "confidence": 0.0 to 1.0
}}

If action is "trade", also include:
{{
    "direction": "buy" or "sell",
    "amount": number (suggested trade amount)
}}

Your response (JSON only):"""
        
        return prompt
    
    def _query_ollama(self, prompt: str) -> str:
        """Query Ollama API"""
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 200
            }
        }
        
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        return result.get('response', '')
    
    def _parse_ai_response(self, response: str) -> Optional[Dict]:
        """Parse AI response into structured action"""
        try:
            # Try to find JSON in the response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                return None
            
            json_str = response[start_idx:end_idx]
            action_data = json.loads(json_str)
            
            # Validate required fields
            if 'action' not in action_data:
                return None
            
            return action_data
            
        except json.JSONDecodeError:
            print(f"Failed to parse AI response: {response[:100]}")
            return None
    
    def predict_market(self, world_state: Dict, history: list) -> Optional[Dict]:
        """
        Use AI to predict future market conditions
        
        Args:
            world_state: Current world state
            history: Historical world states
            
        Returns:
            Prediction dict or None
        """
        if not self.available:
            return None
        
        # Build historical context
        price_history = [h.get('market_price', 0) for h in history[-10:]]
        price_trend = "rising" if len(price_history) >= 2 and price_history[-1] > price_history[0] else "falling"
        
        prompt = f"""Analyze this market data and predict the next price movement.

Current Price: ${world_state.get('market_price', 0):.2f}
Current Volatility: {world_state.get('volatility', 0):.2%}
Price Trend: {price_trend}
Recent Prices: {price_history}

Predict:
1. Will price go up or down?
2. How confident are you (0-1)?
3. What's the expected magnitude of change?

Respond with JSON only:
{{
    "direction": "up" or "down",
    "confidence": 0.0 to 1.0,
    "magnitude": 0.0 to 1.0
}}

Your response:"""
        
        try:
            response = self._query_ollama(prompt)
            prediction = self._parse_ai_response(response)
            return prediction
        except:
            return None


# Singleton instance
_ai_reasoner_instance = None

def get_ai_reasoner(model: str = "llama2") -> AIReasoner:
    """Get or create AI reasoner singleton"""
    global _ai_reasoner_instance
    if _ai_reasoner_instance is None:
        _ai_reasoner_instance = AIReasoner(model=model)
    return _ai_reasoner_instance
