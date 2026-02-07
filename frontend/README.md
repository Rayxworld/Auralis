# Auralis Next.js Frontend

Professional Next.js frontend for the Auralis multi-agent simulation platform.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000

## Backend Connection

Make sure the Python backend is running on port 8000:

```bash
cd backend/api
python server.py
```

The Next.js app proxies `/api/*` to `http://localhost:8000/*`

## Pages

- `/` - Landing page with hero & stats
- `/dashboard` - Agent explorer with filters
- `/simulation` - Live simulation with chart

## Features

✅ Real-time agent updates
✅ WebSocket integration
✅ Responsive design with TailwindCSS
✅ TypeScript for type safety
✅ Token-gated world vision ready

## Token-Gated World Features (Coming Soon)

- MON token entry fees
- Agent interaction protocols
- Persistent world state
- Economic systems
- Multi-agent coordination

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Recharts
- WebSocket

## Build

```bash
npm run build
npm start
```
