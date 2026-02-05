const API_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws';

const MAX_EVENTS_SHOWN = 80;
const MAX_CHART_POINTS = 60;

let ws = null;
let priceChart = null;
let priceData = {
    labels: [],
    datasets: [{
        label: 'Market Price',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
    }]
};

function initWebSocket() {
    ws = new WebSocket(WS_URL);
    ws.onopen = () => console.log('WebSocket connected');
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
        console.log('WebSocket closed – reconnecting...');
        setTimeout(initWebSocket, 1500);
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
            scales: {
                x: { display: true, title: { display: true, text: 'Time Step' } },
                y: { beginAtZero: false, title: { display: true, text: 'Price' } }
            },
            plugins: {
                legend: { display: true, position: 'top' }
            }
        }
    });
}

function updateQuickStatus(state) {
    const priceEl = document.getElementById('market-price');
    const volEl = document.getElementById('market-volatility');
    if (priceEl) priceEl.textContent = `Price: $${(state.market_price || 0).toFixed(2)}`;
    if (volEl) volEl.textContent = `Volatility: ${((state.volatility || 0) * 100).toFixed(1)}%`;
}

function updateDashboard(stepData) {
    const stateEl = document.getElementById('state-output');
    if (stateEl) stateEl.textContent = JSON.stringify(stepData.state, null, 2);

    // Chart
    priceData.labels.push(stepData.time);
    priceData.datasets[0].data.push(stepData.state.market_price);

    if (priceData.labels.length > MAX_CHART_POINTS) {
        priceData.labels.shift();
        priceData.datasets[0].data.shift();
    }
    if (priceChart) priceChart.update();

    updateQuickStatus(stepData.state);

    // Events
    const eventsList = document.getElementById('events-list');
    if (eventsList) {
        stepData.actions.forEach(action => {
            const li = document.createElement('li');
            const time = stepData.time ?? '—';
            const resultStr = action.result?.success === false 
                ? `FAILED: ${action.result.reason || '—'}`
                : JSON.stringify(action.result).slice(0, 120);
            li.textContent = `[${time}] ${action.agent} → ${action.action.type}  ${resultStr}`;
            if (action.action.type === 'trade') li.style.fontWeight = 'bold';
            eventsList.appendChild(li);
        });

        while (eventsList.children.length > MAX_EVENTS_SHOWN) {
            eventsList.removeChild(eventsList.firstChild);
        }

        const box = document.getElementById('events-box') || eventsList.parentElement;
        if (box) box.scrollTop = box.scrollHeight;
    }

    getAgents();
}

async function createSimulation() {
    try {
        const res = await fetch(`${API_URL}/simulation/create`, { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        updateDashboard({ state: data.world, time: 0, actions: [] });
        getAgents();
    } catch (err) {
        console.error('Create failed:', err);
        alert('Failed to create simulation');
    }
}

async function startSimulation() {
    try {
        const res = await fetch(`${API_URL}/simulation/start`, { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
        console.error('Start failed:', err);
    }
}

async function stopSimulation() {
    try {
        const res = await fetch(`${API_URL}/simulation/stop`, { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
        if (document.getElementById('state-output')) {
            document.getElementById('state-output').textContent = '';
        }
        priceData.labels = [];
        priceData.datasets[0].data = [];
        if (priceChart) priceChart.update();

        const tbody = document.getElementById('agents-table')?.tBodies[0];
        if (tbody) tbody.innerHTML = '';

        const eventsList = document.getElementById('events-list');
        if (eventsList) eventsList.innerHTML = '';

        document.getElementById('market-price')?.textContent = 'Price: —';
        document.getElementById('market-volatility')?.textContent = 'Volatility: —';
    } catch (err) {
        console.error('Reset failed:', err);
    }
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
            tr.innerHTML = `
                <td>${agent.name}</td>
                <td>$${Number(agent.balance || 0).toFixed(2)}</td>
                <td>${Number(agent.holdings || 0).toFixed(4)}</td>
                <td>$${Number(agent.portfolio_value || 0).toFixed(2)}</td>
                <td style="color: ${pl >= 0 ? 'green' : 'red'}">
                    $${pl.toFixed(2)}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Get agents failed:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    initChart();
    // Optional periodic refresh
    setInterval(getAgents, 5000);
});