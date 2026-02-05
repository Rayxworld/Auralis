# 🌍 AURALIS - World Model Agent Simulation

Auralis is a world-model agent simulation platform where autonomous AI agents coexist, observe, reason, and act in a shared environment.

## 🎯 Features

- **Multi-Agent Simulation**: Multiple autonomous agents with distinct personalities
- **World Model**: Shared environment with market dynamics and resources
- **Agent Behaviors**: 
  - Cautious (risk-averse, stability-seeking)
  - Aggressive (risk-tolerant, opportunity-seeking)
  - Trend Follower (follows market trends)
- **Real-time Dashboard**: Live visualization of agents and world state
- **Event Logging**: Complete history of all agent actions
- **Offline First**: No paid APIs required - runs completely locally

## 📁 Project Structure

```
auralis/
├── backend/
│   ├── agents/        # Agent definitions and logic
│   │   └── agent.py   # Base Agent class + personality types
│   ├── world/         # World simulation logic
│   │   └── world.py   # World state and event resolution
│   ├── api/           # Backend API server
│   │   └── server.py  # FastAPI server with WebSocket support
│   ├── data/          # Saved simulation states (auto-created)
│   ├── requirements.txt
│   └── main.py        # CLI simulation runner
├── frontend/          # Dashboard / visualization
│   ├── index.html     # Main dashboard
│   ├── css/
│   │   └── style.css  # Styling
│   └── js/
│       └── app.js     # Dashboard logic
├── blockchain/        # (Future) Smart contracts for on-chain logging
│   ├── contracts/
│   ├── scripts/
│   └── abi/
└── docs/              # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- A modern web browser

### Installation

1. **Clone or extract the project**

2. **Install Python dependencies**:
```bash
cd auralis/backend
pip install -r requirements.txt
```

### Running the Simulation

#### Option 1: Command Line (Simple)

Run a basic simulation with default settings:

```bash
cd auralis/backend
python main.py
```

Run for a specific number of steps:

```bash
python main.py 50
```

Run in interactive mode:

```bash
python main.py interactive
```

Interactive commands:
- `step [n]` - Run n steps (default: 1)
- `state` - Show world state
- `agents` - Show agent states  
- `events` - Show recent events
- `save` - Save current state
- `quit` - Exit

#### Option 2: Full Dashboard (Recommended)

1. **Start the API server**:
```bash
cd auralis/backend/api
python server.py
```

The API will start on `http://localhost:8000`

2. **Open the dashboard**:
```bash
cd auralis/frontend
# Open index.html in your browser, or use a simple HTTP server:
python -m http.server 3000
```

Then visit `http://localhost:3000` in your browser.

3. **Using the Dashboard**:
   - Click **"Create Simulation"** to initialize the world and agents
   - Click **"Start"** to run continuously
   - Click **"Stop"** to pause
   - Click **"Step"** to advance one time step manually
   - Click **"Reset"** to clear everything

## 🤖 Agent Types

### Cautious Agent
- **Strategy**: Risk-averse, stability-seeking
- **Behavior**: Only acts when confident and volatility is low
- **Trade Size**: Small amounts
- **Risk Tolerance**: 0.2

### Aggressive Agent  
- **Strategy**: Risk-tolerant, opportunity-seeking
- **Behavior**: Trades frequently based on momentum
- **Trade Size**: Large amounts (up to 30% of balance)
- **Risk Tolerance**: 0.9

### Trend Follower Agent
- **Strategy**: Follows market trends and other agents
- **Behavior**: Copies successful patterns
- **Trade Size**: Medium amounts (20% of balance)
- **Risk Tolerance**: 0.5

### Simple Agent (Test)
- **Strategy**: Random actions for testing
- **Behavior**: Takes random actions each step
- **Purpose**: Baseline comparison

## 🌍 World Mechanics

### Time Steps
- Simulation progresses in discrete time steps
- Each step: World updates → Agents observe → Agents decide → Actions resolve

### Market Dynamics
- **Market Price**: Fluctuates based on volatility and agent activity
- **Volatility**: Increases with more agent actions
- **Resources**: Shared pool affecting world state

### Economic Model
- Each agent starts with $100 balance
- Actions cost 1 unit (economic friction)
- Agents can trade, accumulate holdings
- Portfolio value = balance + (holdings × market_price)

### Agent Loop
Each agent follows the observe-predict-decide-act-learn cycle:

1. **Observe**: See world state (price, volatility, events)
2. **Predict**: Make predictions about future states
3. **Decide**: Choose an action based on observations and personality
4. **Act**: Execute the action (trade, communicate, observe)
5. **Learn**: Update internal state based on action results

## 📊 API Endpoints

### Simulation Control
- `POST /simulation/create` - Create new simulation
- `POST /simulation/start` - Start continuous simulation
- `POST /simulation/stop` - Stop/pause simulation
- `POST /simulation/step?steps=N` - Execute N steps manually
- `POST /simulation/reset` - Reset everything

### Data Access
- `GET /simulation/state` - Get current state
- `GET /simulation/agents` - Get all agent states
- `GET /simulation/events?limit=N` - Get recent events
- `GET /simulation/history` - Get complete history

### Real-time
- `WS /ws` - WebSocket for live updates

## 💾 Saved Data

Simulations are automatically saved to `backend/data/` with timestamps:
- `simulation_YYYYMMDD_HHMMSS.json` - Complete world state
- `interactive_YYYYMMDD_HHMMSS.json` - Interactive session saves

## 🔧 Customization

### Creating Custom Agents

Extend the `Agent` base class in `backend/agents/agent.py`:

```python
from agents.agent import Agent

class MyCustomAgent(Agent):
    def __init__(self, name: str, initial_balance: float = 100):
        personality = {
            'risk_tolerance': 0.7,
            'confidence_threshold': 0.6,
            'strategy': 'custom'
        }
        super().__init__(name, personality, initial_balance)
    
    def predict(self, observation):
        # Your prediction logic
        return {'prediction': 'value'}
    
    def decide(self, world):
        # Your decision logic
        observation = self.observe(world)
        
        return {
            'agent': self.name,
            'type': 'trade',
            'direction': 'buy',
            'amount': 10,
            'time': world.time
        }
```

### Modifying World Dynamics

Edit `backend/world/world.py` to change:
- Market price calculation
- Volatility formulas
- Resource mechanics
- Event resolution logic

## 🎓 Use Cases

### Research & Learning
- Study emergent behaviors in multi-agent systems
- Experiment with different agent strategies
- Understand market dynamics and agent interactions

### AI Education
- Demonstrate autonomous agent principles
- Teach reinforcement learning concepts
- Visualize decision-making processes

### Algorithm Testing
- Test trading strategies in a safe environment
- Compare different agent personalities
- Analyze success patterns

## 🚧 Future Enhancements

### Phase 2 (Planned)
- [ ] More agent personality types (contrarian, cooperative)
- [ ] Enhanced learning mechanisms (RL-based)
- [ ] Agent communication protocols
- [ ] Coalition formation

### Phase 3 (Planned)
- [ ] Monad testnet integration
- [ ] On-chain action logging
- [ ] Verifiable simulation proofs

### Phase 4 (Planned)
- [ ] Advanced visualization (3D world view)
- [ ] Agent memory analysis tools
- [ ] Scenario builder UI
- [ ] Export/import simulation configs

## 📝 Notes

- **No Real Value**: All trades and actions are simulated - no real money involved
- **Offline First**: Runs completely locally without external APIs
- **Reproducible**: Same seed = same results
- **Educational**: Designed for learning and experimentation

## 🐛 Troubleshooting

### Port Already in Use
If port 8000 or 3000 is taken:
```bash
# For API server:
python server.py --port 8001

# For frontend:
python -m http.server 3001
```

### WebSocket Connection Failed
- Ensure API server is running
- Check browser console for errors
- Verify firewall settings

### Agents Not Acting
- Ensure simulation is created first
- Check agent balance (must be > 1 for actions)
- Verify world.time is incrementing

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🤝 Contributing

This is an open educational project. Feel free to:
- Add new agent types
- Improve world dynamics
- Enhance the dashboard
- Add documentation

## 📧 Contact

For questions or feedback about Auralis, open an issue or reach out!

---

**Built for experimentation, learning, and fun. Not financial advice. No real value involved.**