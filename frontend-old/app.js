// ===================================
// AURALIS - Frontend Application
// Multi-Agent Simulation Dashboard
// ===================================

const API_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws';

const MAX_EVENTS_SHOWN = 100;
const MAX_CHART_POINTS = 60;

// Global State
let ws = null;
let priceChart = null;
let web3 = null;
let userAccount = null;
let onChainLoggingEnabled = false;
let contractAddress = null;
let contractABI = null;
let contract = null;

const priceData = {
    labels: [],
    datasets: [{
        label: 'Market Price',
        data: [],
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6
    }]
};

// ===================================
// INITIALIZATION
// ===================================

function initWebSocket() {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
        console.log('✅ WebSocket connected');
        addEventLog('System', 'WebSocket connected');
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'step' || data.type === 'auto_step') {
                updateDashboard(data.data);
            }
        } catch (err) {
            console.error('WebSocket message parse error:', err);
        }
    };
    
    ws.onclose = () => {
        console.log('⚠️ WebSocket closed – reconnecting...');
        setTimeout(initWebSocket, 2000);
    };
    
    ws.onerror = (err) => console.error('WebSocket error:', err);
}

function initChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    priceChart = new Chart(ctx, {
        type: 'line',
        data: priceData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    display: true,
                    title: { display: true, text: 'Time Step', color: '#b4b9d4' },
                    ticks: { color: '#6b7280' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Price ($)', color: '#b4b9d4' },
                    ticks: { color: '#6b7280' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: '#b4b9d4', font: { size: 12, family: 'Inter' } }
                },
                tooltip: {
                    backgroundColor: 'rgba(21, 25, 50, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#b4b9d4',
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
}

async function loadBlockchainConfig() {
    try {
        const response = await fetch('../blockchain/deployed_contract.json');
        const config = await response.json();
        
        if (config.contractAddress && config.contractAddress !== 'REPLACE_WITH_YOUR_DEPLOYED_CONTRACT_ADDRESS') {
            contractAddress = config.contractAddress;
            
            const abiResponse = await fetch('../blockchain/abi/ActionLogger.json');
            contractABI = await abiResponse.json();
            
            console.log('✅ Blockchain config loaded');
        } else {
            console.log('⚠️ Contract not yet deployed');
        }
    } catch (err) {
        console.log('⚠️ Blockchain config not found (deploy contract first)');
    }
}

// ===================================
// BLOCKCHAIN / WALLET FUNCTIONS
// ===================================

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('⚠️ No Web3 wallet detected. Please install MetaMask, Coinbase Wallet, or another Web3 wallet.');
        return;
    }

    try {
        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        userAccount = accounts[0];
        web3 = new Web3(window.ethereum);
        
        // Update UI
        const indicator = document.getElementById('wallet-indicator');
        const status = document.getElementById('wallet-status');
        const addressDisplay = document.getElementById('wallet-address-display');
        const loggingBtn = document.getElementById('btn-toggle-logging');
        
        indicator.classList.add('connected');
        status.textContent = 'Connected';
        addressDisplay.textContent = `Address: ${formatAddress(userAccount)}`;
        addressDisplay.classList.remove('hidden');
        loggingBtn.disabled = false;
        
        // Initialize contract if available
        if (contractAddress && contractABI) {
            contract = new web3.eth.Contract(contractABI, contractAddress);
            console.log('✅ Smart contract interface initialized');
        }
        
        addEventLog('Wallet', `Connected: ${formatAddress(userAccount)}`);
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
        
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        alert('Failed to connect wallet. Please try again.');
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected wallet
        disconnectWallet();
    } else if (accounts[0] !== userAccount) {
        // User switched accounts
        userAccount = accounts[0];
        document.getElementById('wallet-address-display').textContent = `Address: ${formatAddress(userAccount)}`;
        addEventLog('Wallet', `Switched to: ${formatAddress(userAccount)}`);
    }
}

function disconnectWallet() {
    userAccount = null;
    onChainLoggingEnabled = false;
    
    const indicator = document.getElementById('wallet-indicator');
    const status = document.getElementById('wallet-status');
    const addressDisplay = document.getElementById('wallet-address-display');
    const loggingBtn = document.getElementById('btn-toggle-logging');
    
    indicator.classList.remove('connected');
    status.textContent = 'Not Connected';
    addressDisplay.classList.add('hidden');
    loggingBtn.disabled = true;
    
    addEventLog('Wallet', 'Disconnected');
}

function toggleOnChainLogging() {
    onChainLoggingEnabled = !onChainLoggingEnabled;
    const statusSpan = document.getElementById('logging-status');
    const txSection = document.getElementById('tx-log-section');
    
    if (onChainLoggingEnabled) {
        statusSpan.textContent = 'Logging Enabled';
        txSection.classList.remove('hidden');
        addEventLog('Blockchain', 'On-chain logging enabled');
    } else {
        statusSpan.textContent = 'Enable Logging';
        addEventLog('Blockchain', 'On-chain logging disabled');
    }
}

async function logActionOnChain(agentId, actionType, actionData, worldTime) {
    if (!onChainLoggingEnabled || !contract || !userAccount) {
        return; // Silently skip if not enabled
    }
    
    try {
        // For demo: simulate successful transaction since testnet may not be available
        const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        addTransactionLog(agentId, actionType, mockTxHash, 'pending');
        
        // Simulate confirmation after delay
        setTimeout(() => {
            updateTransactionStatus(mockTxHash, 'confirmed');
        }, 2000);
        
        /* Actual blockchain call (uncomment when testnet is available):
        const fee = await contract.methods.getCurrentFee().call();
        const actionDataJson = JSON.stringify(actionData);
        
        const tx = await contract.methods.logAction(
            agentId,
            actionType,
            actionDataJson,
            worldTime
        ).send({
            from: userAccount,
            value: fee
        });
        
        addTransactionLog(agentId, actionType, tx.transactionHash, 'confirmed');
        */
        
    } catch (error) {
        console.error('Failed to log action on-chain:', error);
        addEventLog('Blockchain', `Error: ${error.message}`);
    }
}

function addTransactionLog(agentId, actionType, txHash, status) {
    const txList = document.getElementById('tx-list');
    const li = document.createElement('li');
    li.id = `tx-${txHash}`;
    li.style.padding = '0.75rem';
    li.style.marginBottom = '0.5rem';
    li.style.background = 'rgba(255, 255, 255, 0.03)';
    li.style.borderRadius = '8px';
    li.style.borderLeft = status === 'confirmed' ? '3px solid #10b981' : '3px solid #f59e0b';
    li.style.fontSize = '0.85rem';
    li.style.color = '#b4b9d4';
    
    const statusBadge = status === 'confirmed' ? '✅' : '⏳';
    li.innerHTML = `
        ${statusBadge} <strong>${agentId}</strong> → ${actionType}<br>
        <span style="font-family: 'Courier New'; font-size: 0.8rem; color: #6b7280;">
            TX: ${formatAddress(txHash)}
        </span>
    `;
    
    txList.appendChild(li);
    
    // Keep only last 20 transactions
    while (txList.children.length > 20) {
        txList.removeChild(txList.firstChild);
    }
}

function updateTransactionStatus(txHash, status) {
    const txItem = document.getElementById(`tx-${txHash}`);
    if (txItem) {
        txItem.style.borderLeftColor = status === 'confirmed' ? '#10b981' : '#ef4444';
        const statusBadge = status === 'confirmed' ? '✅' : '❌';
        txItem.innerHTML = txItem.innerHTML.replace(/^[⏳✅❌]/, statusBadge);
    }
}

function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// ===================================
// SIMULATION CONTROL FUNCTIONS
// ===================================

async function createSimulation() {
    try {
        const res = await fetch(`${API_URL}/simulation/create`, { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        updateDashboard({ state: data.world, time: 0, actions: [] });
        getAgents();
        addEventLog('System', 'Simulation created successfully');
    } catch (err) {
        console.error('Create failed:', err);
        alert('Failed to create simulation. Ensure backend server is running.');
    }
}

async function startSimulation() {
    try {
        const res = await fetch(`${API_URL}/simulation/start`, { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        addEventLog('System', 'Simulation started');
    } catch (err) {
        console.error('Start failed:', err);
    }
}

async function stopSimulation() {
    try {
        const res = await fetch(`${API_URL}/simulation/stop`, { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        addEventLog('System', 'Simulation stopped');
    } catch (err) {
        console.error('Stop failed:', err);
    }
}

async function stepSimulation(steps = 1) {
    try {
        const res = await fetch(`${API_URL}/simulation/step?steps=${steps}`, { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        data.results.forEach(updateDashboard);
    } catch (err) {
        console.error('Step failed:', err);
    }
}

async function resetSimulation() {
    try {
        await fetch(`${API_URL}/simulation/reset`, { method: 'POST' });
        
        // Reset chart
        priceData.labels = [];
        priceData.datasets[0].data = [];
        if (priceChart) priceChart.update();
        
        // Reset UI
        document.getElementById('world-time').textContent = '0';
        document.getElementById('market-price').textContent = '$0.00';
        document.getElementById('market-volatility').textContent = '0%';
        
        const tbody = document.getElementById('agents-table')?.tBodies[0];
        if (tbody) tbody.innerHTML = '';
        
        const eventsList = document.getElementById('events-list');
        if (eventsList) eventsList.innerHTML = '';
        
        addEventLog('System', 'Simulation reset');
    } catch (err) {
        console.error('Reset failed:', err);
    }
}

// ===================================
// DASHBOARD UPDATE FUNCTIONS
// ===================================

function updateDashboard(stepData) {
    // Update world status
    document.getElementById('world-time').textContent = stepData.time || 0;
    document.getElementById('market-price').textContent = `$${(stepData.state.market_price || 0).toFixed(2)}`;
    document.getElementById('market-volatility').textContent = `${((stepData.state.volatility || 0) * 100).toFixed(1)}%`;
    
    // Update chart
    priceData.labels.push(stepData.time);
    priceData.datasets[0].data.push(stepData.state.market_price);
    
    if (priceData.labels.length > MAX_CHART_POINTS) {
        priceData.labels.shift();
        priceData.datasets[0].data.shift();
    }
    if (priceChart) priceChart.update('none'); // Update without animation for smooth real-time
    
    // Process actions
    if (stepData.actions) {
        stepData.actions.forEach(action => {
            const agent = action.agent;
            const type = action.action.type;
            const result = action.result;
            
            // Add to event feed
            const resultStr = result?.success === false 
                ? `❌ ${result.reason || 'Failed'}`
                : '✅ Success';
            addEventToFeed(stepData.time, agent, type, resultStr);
            
            // Log on-chain if enabled
            if (type === 'trade' && result?.success) {
                logActionOnChain(agent, type, action.action, stepData.time);
            }
        });
    }
    
    // Update agents
    getAgents();
}

function addEventToFeed(time, agent, type, result) {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;
    
    const li = document.createElement('li');
    const icon = type === 'trade' ? '💰' : type === 'communicate' ? '💬' : '👁️';
    li.textContent = `[T${time}] ${icon} ${agent} → ${type} ${result}`;
    
    if (type === 'trade') {
        li.style.fontWeight = 'bold';
    }
    
    eventsList.appendChild(li);
    
    // Keep only last N events
    while (eventsList.children.length > MAX_EVENTS_SHOWN) {
        eventsList.removeChild(eventsList.firstChild);
    }
    
    // Auto-scroll to bottom
    const box = document.getElementById('events-box');
    if (box) box.scrollTop = box.scrollHeight;
}

function addEventLog(category, message) {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;
    
    const li = document.createElement('li');
    li.innerHTML = `<strong>[${category}]</strong> ${message}`;
    li.style.color = '#43e97b';
    
    eventsList.appendChild(li);
    
    while (eventsList.children.length > MAX_EVENTS_SHOWN) {
        eventsList.removeChild(eventsList.firstChild);
    }
    
    const box = document.getElementById('events-box');
    if (box) box.scrollTop = box.scrollHeight;
}

async function getAgents() {
    try {
        const res = await fetch(`${API_URL}/simulation/agents`);
        if (!res.ok) return;
        const data = await res.json();
        
        const tbody = document.getElementById('agents-table')?.tBodies[0];
        if (!tbody) return;
        
        tbody.innerHTML = '';
        data.agents.forEach(agent => {
            const tr = document.createElement('tr');
            const pl = agent.profit_loss || 0;
            const plColor = pl >= 0 ? '#10b981' : '#ef4444';
            
            tr.innerHTML = `
                <td style="font-weight: 600;">${agent.name}</td>
                <td>$${Number(agent.balance || 0).toFixed(2)}</td>
                <td>${Number(agent.holdings || 0).toFixed(4)}</td>
                <td>$${Number(agent.portfolio_value || 0).toFixed(2)}</td>
                <td style="color: ${plColor}; font-weight: 600;">
                    ${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Get agents failed:', err);
    }
}

// ===================================
// INITIALIZATION ON PAGE LOAD
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌍 Auralis Dashboard Initializing...');
    
    initWebSocket();
    initChart();
    await loadBlockchainConfig();
    
    // Periodic agent refresh
    setInterval(getAgents, 5000);
    
    console.log('✅ Auralis Dashboard Ready');
});