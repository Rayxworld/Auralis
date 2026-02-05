/**
 * Auralis Dashboard - Main Application
 */

const API_BASE = 'http://localhost:8000';

// State
let priceChart = null;
let wsConnection = null;
let priceHistory = [];

// DOM Elements
const createBtn = document.getElementById('createBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const stepBtn = document.getElementById('stepBtn');
const resetBtn = document.getElementById('resetBtn');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 Auralis Dashboard Loaded');
    
    // Setup event listeners
    createBtn.addEventListener('click', createSimulation);
    startBtn.addEventListener('click', startSimulation);
    stopBtn.addEventListener('click', stopSimulation);
    stepBtn.addEventListener('click', stepSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    
    // Initialize chart
    initChart();
    
    // Connect WebSocket
    connectWebSocket();
});

/**
 * Initialize the price chart
 */
function initChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Market Price',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time Step'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                }
            }
        }
    });
}

/**
 * Connect to WebSocket for real-time updates
 */
function connectWebSocket() {
    wsConnection = new WebSocket(`ws://localhost:8000/ws`);
    
    wsConnection.onopen = () => {
        console.log('✅ WebSocket connected');
    };
    
    wsConnection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'step' || data.type === 'auto_step') {
            handleSimulationUpdate(data.data);
        }
    };
    
    wsConnection.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
    };
    
    wsConnection.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
    };
}

/**
 * Create a new simulation
 */
async function createSimulation() {
    try {
        updateStatus('Creating...', 'stopped');
        
        const response = await fetch(`${API_BASE}/simulation/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                num_agents: 5,
                agent_types: ['cautious', 'aggressive', 'trend', 'aggressive', 'cautious'],
                initial_balance: 100
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'created') {
            updateStatus('Ready', 'stopped');
            startBtn.disabled = false;
            stepBtn.disabled = false;
            
            // Update world state
            updateWorldState(data.world);
            
            // Display agents
            displayAgents(data.agents);
            
            // Reset chart
            priceHistory = [];
            updateChart(data.world.time, data.world.market_price);
            
            showNotification('✅ Simulation created successfully!');
        }
        
    } catch (error) {
        console.error('Error creating simulation:', error);
        showNotification('❌ Failed to create simulation', 'error');
        updateStatus('Error', 'stopped');
    }
}

/**
 * Start the simulation
 */
async function startSimulation() {
    try {
        const response = await fetch(`${API_BASE}/simulation/start`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.status === 'started') {
            updateStatus('Running', 'running');
            startBtn.disabled = true;
            stopBtn.disabled = false;
            stepBtn.disabled = true;
            createBtn.disabled = true;
            
            showNotification('▶️ Simulation started!');
        }
        
    } catch (error) {
        console.error('Error starting simulation:', error);
        showNotification('❌ Failed to start simulation', 'error');
    }
}

/**
 * Stop the simulation
 */
async function stopSimulation() {
    try {
        const response = await fetch(`${API_BASE}/simulation/stop`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.status === 'stopped') {
            updateStatus('Paused', 'stopped');
            startBtn.disabled = false;
            stopBtn.disabled = true;
            stepBtn.disabled = false;
            createBtn.disabled = false;
            
            showNotification('⏸️ Simulation paused');
        }
        
    } catch (error) {
        console.error('Error stopping simulation:', error);
        showNotification('❌ Failed to stop simulation', 'error');
    }
}

/**
 * Step the simulation manually
 */
async function stepSimulation() {
    try {
        const response = await fetch(`${API_BASE}/simulation/step?steps=1`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.status === 'success' && data.results.length > 0) {
            const result = data.results[0];
            handleSimulationUpdate(result);
        }
        
    } catch (error) {
        console.error('Error stepping simulation:', error);
        showNotification('❌ Failed to step simulation', 'error');
    }
}

/**
 * Reset the simulation
 */
async function resetSimulation() {
    try {
        const response = await fetch(`${API_BASE}/simulation/reset`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.status === 'reset') {
            updateStatus('Not Started', '');
            startBtn.disabled = true;
            stopBtn.disabled = true;
            stepBtn.disabled = true;
            createBtn.disabled = false;
            
            // Clear UI
            document.getElementById('agentsList').innerHTML = '<p class="empty-state">No agents yet. Create a simulation to begin.</p>';
            document.getElementById('eventsList').innerHTML = '<p class="empty-state">No events yet.</p>';
            
            // Reset world stats
            document.getElementById('timeStep').textContent = '0';
            document.getElementById('marketPrice').textContent = '$100.00';
            document.getElementById('volatility').textContent = '10.0%';
            document.getElementById('numAgents').textContent = '0';
            
            // Clear chart
            priceHistory = [];
            priceChart.data.labels = [];
            priceChart.data.datasets[0].data = [];
            priceChart.update();
            
            showNotification('🔄 Simulation reset');
        }
        
    } catch (error) {
        console.error('Error resetting simulation:', error);
        showNotification('❌ Failed to reset simulation', 'error');
    }
}

/**
 * Handle simulation update from WebSocket or manual step
 */
function handleSimulationUpdate(data) {
    updateWorldState(data.state);
    updateChart(data.time, data.state.market_price);
    updateEvents(data.actions);
    
    // Refresh agents periodically
    if (data.time % 5 === 0) {
        refreshAgents();
    }
}

/**
 * Update world state display
 */
function updateWorldState(state) {
    document.getElementById('timeStep').textContent = state.time;
    document.getElementById('marketPrice').textContent = `$${state.market_price.toFixed(2)}`;
    document.getElementById('volatility').textContent = `${(state.volatility * 100).toFixed(1)}%`;
    document.getElementById('numAgents').textContent = state.num_agents;
}

/**
 * Update price chart
 */
function updateChart(time, price) {
    priceHistory.push({ time, price });
    
    // Keep last 50 points
    if (priceHistory.length > 50) {
        priceHistory.shift();
    }
    
    priceChart.data.labels = priceHistory.map(p => p.time);
    priceChart.data.datasets[0].data = priceHistory.map(p => p.price);
    priceChart.update('none'); // Update without animation for performance
}

/**
 * Display agents
 */
function displayAgents(agents) {
    const agentsList = document.getElementById('agentsList');
    agentsList.innerHTML = '';
    
    agents.forEach(agent => {
        const agentCard = createAgentCard(agent);
        agentsList.appendChild(agentCard);
    });
}

/**
 * Create agent card element
 */
function createAgentCard(agent) {
    const card = document.createElement('div');
    const strategy = agent.personality?.strategy || 'simple';
    card.className = `agent-card ${strategy}`;
    
    const portfolioValue = agent.portfolio_value || agent.balance;
    const profitLoss = agent.profit_loss || 0;
    const profitClass = profitLoss >= 0 ? 'profit-positive' : 'profit-negative';
    
    card.innerHTML = `
        <div class="agent-header">
            <span class="agent-name">${agent.name}</span>
            <span class="agent-strategy">${strategy}</span>
        </div>
        <div class="agent-stats">
            <div class="agent-stat">Balance: <strong>$${agent.balance.toFixed(2)}</strong></div>
            <div class="agent-stat">Holdings: <strong>${agent.holdings.toFixed(4)}</strong></div>
            <div class="agent-stat">Portfolio: <strong>$${portfolioValue.toFixed(2)}</strong></div>
            <div class="agent-stat">P/L: <strong class="${profitClass}">${profitLoss >= 0 ? '+' : ''}$${profitLoss.toFixed(2)}</strong></div>
            <div class="agent-stat">Actions: <strong>${agent.action_count}</strong></div>
            <div class="agent-stat">Success: <strong>${(agent.success_rate * 100).toFixed(1)}%</strong></div>
        </div>
    `;
    
    return card;
}

/**
 * Refresh agents data
 */
async function refreshAgents() {
    try {
        const response = await fetch(`${API_BASE}/simulation/agents`);
        const data = await response.json();
        
        if (data.agents) {
            displayAgents(data.agents);
        }
        
    } catch (error) {
        console.error('Error refreshing agents:', error);
    }
}

/**
 * Update events list
 */
function updateEvents(actions) {
    const eventsList = document.getElementById('eventsList');
    
    // Clear empty state
    if (eventsList.querySelector('.empty-state')) {
        eventsList.innerHTML = '';
    }
    
    actions.forEach(actionData => {
        const action = actionData.action;
        const result = actionData.result;
        
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        
        let details = '';
        if (action.type === 'trade') {
            details = `${action.direction} $${action.amount.toFixed(2)} @ $${result.price?.toFixed(2) || '?'}`;
        } else if (action.type === 'communicate') {
            details = action.message;
        } else if (action.type === 'observe') {
            details = 'Observing market';
        }
        
        eventItem.innerHTML = `
            <span class="event-time">T-${action.time}</span>
            <div class="event-content">
                <span class="event-type">${actionData.agent}:</span>
                <span class="event-details">${details}</span>
            </div>
            <span class="event-badge ${action.type}">${action.type}</span>
        `;
        
        // Add to top
        eventsList.insertBefore(eventItem, eventsList.firstChild);
        
        // Keep max 20 events visible
        while (eventsList.children.length > 20) {
            eventsList.removeChild(eventsList.lastChild);
        }
    });
}

/**
 * Update status indicator
 */
function updateStatus(text, state) {
    statusText.textContent = text;
    statusDot.className = 'status-dot';
    
    if (state) {
        statusDot.classList.add(state);
    }
}

/**
 * Show notification (simple alert for now)
 */
function showNotification(message, type = 'info') {
    console.log(message);
    // Could implement a toast notification system here
}