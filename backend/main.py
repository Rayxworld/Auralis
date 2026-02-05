"""
Main simulation runner for Auralis.
Run this to start the world simulation with multiple agents.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from world.world import World
from agents.agent import SimpleAgent, CautiousAgent, AggressiveAgent, TrendFollowerAgent
import json
from datetime import datetime


def run_simulation(num_steps: int = 20, save_results: bool = True):
    """
    Run the Auralis simulation.
    
    Args:
        num_steps: Number of time steps to simulate
        save_results: Whether to save results to file
    """
    print("=" * 60)
    print("AURALIS - World Model Agent Simulation")
    print("=" * 60)
    print()
    
    # Create the world
    world = World(initial_state={
        'resources': 1000,
        'market_price': 100,
        'volatility': 0.1
    })
    
    print("🌍 World created with initial state:")
    print(f"   Market Price: ${world.state['market_price']:.2f}")
    print(f"   Volatility: {world.state['volatility']:.2%}")
    print()
    
    # Create agents with different personalities
    agents = [
        SimpleAgent("Observer-1", initial_balance=100),
        CautiousAgent("Cautious-Carl", initial_balance=100),
        AggressiveAgent("Aggressive-Alice", initial_balance=100),
        TrendFollowerAgent("Trend-Tom", initial_balance=100),
        AggressiveAgent("Aggressive-Bob", initial_balance=100),
    ]
    
    print("🤖 Registering agents:")
    for agent in agents:
        world.register_agent(agent)
        strategy = agent.personality.get('strategy', 'simple')
        print(f"   ✓ {agent.name} ({strategy}) - Balance: ${agent.balance:.2f}")
    print()
    
    # Run simulation
    print(f"▶️  Starting simulation for {num_steps} steps...")
    print("-" * 60)
    print()
    
    for step in range(num_steps):
        print(f"⏱️  Step {world.time + 1}/{num_steps}")
        
        # Execute one step
        step_actions = world.step()
        
        # Display step summary
        print(f"   Market Price: ${world.state['market_price']:.2f}")
        print(f"   Actions taken: {len(step_actions)}")
        
        # Show some interesting actions
        trades = [a for a in step_actions if a['action']['type'] == 'trade']
        if trades:
            print(f"   💰 Trades: {len(trades)}")
            for trade in trades[:2]:  # Show first 2 trades
                agent_name = trade['agent']
                direction = trade['action'].get('direction', 'unknown')
                amount = trade['action'].get('amount', 0)
                print(f"      • {agent_name}: {direction} ${amount:.2f}")
        
        communications = [a for a in step_actions if a['action']['type'] == 'communicate']
        if communications:
            for comm in communications[:1]:  # Show first communication
                agent_name = comm['agent']
                message = comm['action'].get('message', '')
                print(f"   💬 {agent_name}: {message}")
        
        print()
    
    print("-" * 60)
    print("✅ Simulation complete!")
    print()
    
    # Display final agent states
    print("📊 Final Agent States:")
    print()
    for agent in world.agents:
        portfolio_value = agent.balance + (agent.holdings * world.state['market_price'])
        profit = portfolio_value - 100  # Initial balance was 100
        
        print(f"   {agent.name}:")
        print(f"      Balance: ${agent.balance:.2f}")
        print(f"      Holdings: {agent.holdings:.4f} units")
        print(f"      Portfolio Value: ${portfolio_value:.2f}")
        print(f"      Profit/Loss: ${profit:.2f} ({profit:+.1f}%)")
        print(f"      Actions: {agent.action_count}")
        print(f"      Success Rate: {agent.get_success_rate():.1%}")
        print()
    
    # Display world statistics
    print("🌍 World Statistics:")
    print(f"   Total Steps: {world.time}")
    print(f"   Total Events: {len(world.events)}")
    print(f"   Final Market Price: ${world.state['market_price']:.2f}")
    print(f"   Price Change: {(world.state['market_price'] / 100 - 1) * 100:+.2f}%")
    print()
    
    # Save results
    if save_results:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"data/simulation_{timestamp}.json"
        
        os.makedirs("data", exist_ok=True)
        world.save_state(filename)
        
        print(f"💾 Results saved to: {filename}")
        print()
    
    return world


def interactive_mode():
    """Run simulation in interactive mode with user controls."""
    print("=" * 60)
    print("AURALIS - Interactive Mode")
    print("=" * 60)
    print()
    print("Commands:")
    print("  step [n]  - Run n steps (default: 1)")
    print("  state     - Show world state")
    print("  agents    - Show agent states")
    print("  events    - Show recent events")
    print("  save      - Save current state")
    print("  quit      - Exit")
    print()
    
    # Create world and agents
    world = World()
    agents = [
        CautiousAgent("Cautious-1"),
        AggressiveAgent("Aggressive-1"),
        TrendFollowerAgent("Trend-1"),
    ]
    
    for agent in agents:
        world.register_agent(agent)
    
    print(f"✓ World created with {len(agents)} agents")
    print()
    
    # Interactive loop
    while True:
        try:
            command = input("auralis> ").strip().lower()
            
            if not command:
                continue
            
            parts = command.split()
            cmd = parts[0]
            
            if cmd == 'step':
                steps = int(parts[1]) if len(parts) > 1 else 1
                for _ in range(steps):
                    world.step()
                print(f"✓ Ran {steps} step(s). Time: {world.time}")
                
            elif cmd == 'state':
                state = world.get_public_state()
                print(json.dumps(state, indent=2))
                
            elif cmd == 'agents':
                for agent in world.agents:
                    print(f"{agent.name}: Balance=${agent.balance:.2f}, Holdings={agent.holdings:.4f}")
                    
            elif cmd == 'events':
                recent = world.events[-10:]
                for event in recent:
                    print(f"  [{event['time']}] {event['type']}: {event.get('agent', 'system')}")
                    
            elif cmd == 'save':
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"data/interactive_{timestamp}.json"
                os.makedirs("data", exist_ok=True)
                world.save_state(filename)
                print(f"✓ Saved to {filename}")
                
            elif cmd == 'quit':
                print("Goodbye!")
                break
                
            else:
                print(f"Unknown command: {cmd}")
                
        except KeyboardInterrupt:
            print("\nInterrupted. Type 'quit' to exit.")
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'interactive':
        interactive_mode()
    else:
        # Default: run standard simulation
        steps = int(sys.argv[1]) if len(sys.argv) > 1 else 20
        run_simulation(num_steps=steps)