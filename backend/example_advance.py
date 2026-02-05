"""
Advanced example for Auralis simulation.
Demonstrates custom agent creation, loading/saving states, and extended simulation.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from world.world import World
from agents.agent import SimpleAgent, CautiousAgent, AggressiveAgent, TrendFollowerAgent

def advanced_simulation():
    print("AURALIS - Advanced Simulation Example")
    print("=" * 60)
    
    # Create world
    world = World(initial_state={
        'resources': 2000,
        'market_price': 150,
        'volatility': 0.15
    })
    
    # Custom agents
    agents = [
        CautiousAgent("Cautious-Custom-1", initial_balance=200),
        AggressiveAgent("Aggressive-Custom-1", initial_balance=200),
        TrendFollowerAgent("Trend-Custom-1", initial_balance=200),
        SimpleAgent("Observer-Custom-1", initial_balance=200),
    ]
    
    for agent in agents:
        world.register_agent(agent)
    
    print("✓ Agents registered")
    
    # Run 10 steps
    for _ in range(10):
        world.step()
    
    print("✓ Ran 10 steps")
    
    # Save state
    save_path = "data/advanced_save.json"
    os.makedirs("data", exist_ok=True)
    world.save_state(save_path)
    print(f"✓ Saved state to {save_path}")
    
    # Load state into new world
    new_world = World()
    new_world.load_state(save_path)
    print("✓ Loaded state")
    
    # Run additional 10 steps on loaded world
    for _ in range(10):
        new_world.step()
    
    print("✓ Ran additional 10 steps on loaded world")
    
    # Print final stats
    print("\nFinal World Time:", new_world.time)
    print("Final Market Price:", new_world.state['market_price'])

if __name__ == "__main__":
    advanced_simulation()