'use client'

import { useEffect, useState, useRef, useMemo, Suspense } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { auralisApi, World, Agent } from '@/lib/api'
import { useAuralisSocket } from '@/lib/socket'
import AgentCard from '@/components/AgentCard'
import { 
  Zap, Disc, Activity, Clock, TrendingUp, Users, 
  ChevronRight, Box, MessageSquare, Plus, Loader2, Play, Square,
  BarChart3, Globe
} from 'lucide-react'

function SimulationContent() {
  const searchParams = useSearchParams()
  const worldId = searchParams.get('worldId')
  
  const [world, setWorld] = useState<any>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [newAgent, setNewAgent] = useState({ name: '', type: 'simple', balance: 100 })

  // Real-time updates via WebSocket
  const { connected } = useAuralisSocket((message) => {
    if (message.type === 'world_update' && message.world_id === worldId) {
      const data = message.data
      setWorld((prev: any) => ({ ...prev, state: data.state, time: data.time }))
      
      // Update chart
      setPriceHistory(prev => {
        const newHistory = [...prev, { time: data.time, price: data.state.market_price }]
        return newHistory.slice(-50)
      })

      // Update events
      if (data.actions && data.actions.length > 0) {
        const newEvents = data.actions.map((a: any) => ({
          id: `${data.time}-${a.agent}`,
          time: data.time,
          agent: a.agent,
          type: a.action.type,
          desc: `${a.agent} executed ${a.action.type} at ${a.action.price.toFixed(2)}`
        }))
        setEvents(prev => [...newEvents, ...prev].slice(0, 20))
      }

      // Re-fetch agents periodically for detailed metrics
      fetchAgents()
    }
  })

  useEffect(() => {
    if (worldId) {
      initWorld()
    } else {
      setLoading(false)
    }
  }, [worldId])

  const initWorld = async () => {
    try {
      const data = await auralisApi.getWorldDetails(worldId!)
      setWorld(data)
      setPriceHistory([{ time: data.state.time, price: data.state.market_price }])
      fetchAgents()
      setLoading(false)
    } catch (err) {
      console.error('Init world failed', err)
      setLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const data = await auralisApi.getWorldAgents(worldId!)
      setAgents(data)
    } catch (err) {
      console.error('Fetch agents failed', err)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsJoining(true)
    try {
      await auralisApi.joinWorld(worldId!, newAgent)
      await fetchAgents()
      setNewAgent({ name: '', type: 'simple', balance: 100 })
    } catch (err) {
      console.error('Join failed', err)
    } finally {
      setIsJoining(false)
    }
  }

  const toggleSim = async () => {
    if (!world) return
    try {
      if (world.running) {
        await auralisApi.stopWorld(worldId!)
      } else {
        await auralisApi.startWorld(worldId!)
      }
      setWorld({ ...world, running: !world.running })
    } catch (err) {
      console.error('Toggle failed', err)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing World Stream...</p>
      </div>
    )
  }

  if (!worldId || !world) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Disc className="w-16 h-16 text-indigo-500/20 mb-6" />
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">No World Selected</h2>
        <p className="text-gray-400 mb-8 max-w-sm">Please select a simulation from the dashboard to view the command center.</p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black transition-all hover:bg-indigo-600"
        >
          Browse Worlds
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12 pb-32">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center space-x-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
            <Globe className="w-6 h-6 md:w-8 md:h-8 text-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">{world.config.name}</h1>
              <div className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
                world.running ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {world.running ? 'Active' : 'Paused'}
              </div>
            </div>
            <div className="flex items-center space-x-4 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Tick: {world.state.time}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="w-3 h-3 text-indigo-500" />
                <span>ID: {worldId}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={toggleSim}
            className={`flex-grow md:flex-none flex items-center justify-center space-x-3 px-6 py-3 md:px-8 md:py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl ${
              world.running 
                ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' 
                : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/20'
            }`}
          >
            {world.running ? <><Square className="w-4 h-4" /><span>Stop Sim</span></> : <><Play className="w-4 h-4" /><span>Resume Sim</span></>}
          </button>
          <div className={`p-4 rounded-2xl border ${connected ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <Zap className={`w-4 h-4 md:w-5 md:h-5 ${connected ? 'text-green-500 animate-pulse' : 'text-red-500'}`} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Price', val: `$${world.state.market_price.toFixed(2)}`, color: 'text-indigo-400', icon: <TrendingUp className="w-4 h-4" /> },
              { label: 'Volatility', val: `${(world.state.volatility * 100).toFixed(1)}%`, color: 'text-purple-400', icon: <Activity className="w-4 h-4" /> },
              { label: 'Resources', val: world.state.resources, color: 'text-green-400', icon: <Box className="w-4 h-4" /> },
              { label: 'Population', val: agents.length, color: 'text-pink-400', icon: <Users className="w-4 h-4" /> },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 border-white/5"
              >
                <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                  <span className={stat.color}>{stat.icon}</span>
                  <span>{stat.label}</span>
                </div>
                <div className={`text-2xl font-black tracking-tighter ${stat.color}`}>{stat.val}</div>
              </motion.div>
            ))}
          </div>

          <div className="glass-card p-4 md:p-8 min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter">Market Dynamics</h3>
              <div className="flex items-center space-x-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                <BarChart3 className="w-3 h-3 text-indigo-500" />
                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Feed</span>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistory}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    stroke="#374151" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickFormatter={(v) => `T-${v}`}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="#374151" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#030712', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontWeight: 'bold' }}
                    itemStyle={{ color: '#818cf8', textTransform: 'uppercase', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 md:p-8">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-indigo-500" />
              <span>Deploy Agent</span>
            </h3>
            <form onSubmit={handleJoin} className="space-y-4">
              <input 
                required
                type="text" 
                placeholder="Agent Name"
                className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                value={newAgent.name}
                onChange={e => setNewAgent({...newAgent, name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-3">
                <select 
                  className="bg-black/40 border border-white/5 rounded-xl py-3 px-5 text-sm text-white focus:outline-none"
                  value={newAgent.type}
                  onChange={e => setNewAgent({...newAgent, type: e.target.value})}
                >
                  <option value="simple">Simple</option>
                  <option value="aggressive">Aggressive</option>
                  <option value="cautious">Cautious</option>
                  <option value="trend">Trend</option>
                </select>
                <button 
                  type="submit"
                  disabled={isJoining}
                  className="bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center justify-center p-3"
                >
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
                </button>
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center">Fee: {world.config.entry_fee} MON</p>
            </form>
          </div>

          <div className="glass-card p-6 md:p-8 flex flex-col h-[500px]">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <span>World Feed</span>
            </h3>
            <div className="flex-grow overflow-y-auto space-y-4 pr-2 scrollbar-none">
              <AnimatePresence initial={false}>
                {events.map((event) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{event.agent}</span>
                      <span className="text-[9px] text-gray-500 font-mono">T-{event.time}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{event.desc}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Active Participants</h2>
          <div className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-gray-500 border border-white/10 uppercase tracking-widest">
            {agents.length} Entities
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.name} agent={agent} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default function SimulationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    }>
      <SimulationContent />
    </Suspense>
  )
}
