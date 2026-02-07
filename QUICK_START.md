# Quick Start Guide - Auralis

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
cd C:\Users\PC\Auralis-1\backend
pip install -r requirements.txt
```

### 2. (Optional) Start Ollama

If you want AI-enhanced agents:

```bash
ollama serve
ollama pull llama2
```

### 3. Start Backend Server

```bash
cd C:\Users\PC\Auralis-1\backend\api
python server.py
```

### 4. Open Dashboard

Open `C:\Users\PC\Auralis-1\frontend\index.html` in your browser

**OR** use a local server:

```bash
cd C:\Users\PC\Auralis-1\frontend
python -m http.server 3000
```

Then visit: `http://localhost:3000`

### 5. Create & Run Simulation

1. Click **"Create"** to initialize the world
2. Click **"Start"** to run continuously
3. Watch agents act autonomously!

---

## 🎨 What You'll See

- **Premium glassmorphism UI** with animated gradients
- **Real-time price charts** showing market dynamics
- **Live agent cards** with portfolio tracking
- **Event feed** showing all agent actions
- **Blockchain panel** for wallet connection (optional)

---

## 🔗 Optional: Deploy Smart Contract

See `blockchain/REMIX_DEPLOYMENT_GUIDE.md` for step-by-step instructions to deploy to Monad testnet.

---

## ⚡ Quick Commands

**Run CLI Simulation:**
```bash
cd C:\Users\PC\Auralis-1\backend
python main.py 20
```

**Interactive Mode:**
```bash
python main.py interactive
```

---

## 💡 Tips

- AI agents work better with Ollama running
- Blockchain logging is simulated by default (no testnet needed for demos)
- All simulation data is saved in `backend/data/`

---

**Need help?** See the full README.md for detailed documentation.
