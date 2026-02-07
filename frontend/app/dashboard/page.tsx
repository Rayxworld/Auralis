'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WorldCard from '@/components/WorldCard'
import { World, auralisApi } from '@/lib/api'
import { useAuralisSocket } from '@/lib/socket'
import { Plus, Globe, Zap, Search, Filter, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [worlds, setWorlds] = useState<World[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newWorld, setNewWorld] = useState({ name: '', creator: 'User', entry_fee: 10 })
  const [isCreating, setIsCreating] = useState(false)

  // Socket for real-time world state updates
  useAuralisSocket((message) => {
    if (message.type === 'world_update') {
      setWorlds(prev => prev.map(w => 
        w.world_id === message.world_id 
          ? { ...w, active_agents: message.data.agents.length } 
          : w
      ))
    }
  })

  useEffect(() => {
    fetchWorlds()
    const interval = setInterval(fetchWorlds, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchWorlds = async () => {
    try {
      const data = await auralisApi.listWorlds()
      setWorlds(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch worlds:', error)
      setLoading(false)
    }
  }

  const handleCreateWorld = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      await auralisApi.createWorld(newWorld)
      await fetchWorlds()
      setShowCreate(false)
      setNewWorld({ name: '', creator: 'User', entry_fee: 10 })
    } catch (error) {
      console.error('Failed to create world:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const toggleWorld = async (worldId: string, running: boolean) => {
    try {
      if (running) {
        await auralisApi.stopWorld(worldId)
      } else {
        await auralisApi.startWorld(worldId)
      }
      await fetchWorlds()
    } catch (error) {
      console.error('Failed to toggle world:', error)
    }
  }

  const enterWorld = (worldId: string) => {
    router.push(`/simulation?worldId=${worldId}`)
  }

  return (
    <div className="container mx-auto px-6 pt-12 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="max-w-xl">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4"
          >
            <Globe className="w-4 h-4" />
            <span>Simulation Browser</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black leading-tight tracking-tighter"
          >
            VIRTUAL <span className="gradient-text">ECOSYSTEMS</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 mt-4 font-medium"
          >
            Browser and join persistent worlds deployed on the Auralis network. 
            Each environment features unique economic parameters and agent populations.
          </motion.p>
        </div>

        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center space-x-3 px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-indigo-600 transition-all hover:scale-105 shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Deploy New World</span>
        </motion.button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-12">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search worlds by name or creator..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-3 text-gray-400 hover:text-white transition-colors">
          <Filter className="w-5 h-5" />
          <span className="font-bold">Filter</span>
        </button>
      </div>

      {/* World Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing worlds...</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {worlds.map((world) => (
              <WorldCard 
                key={world.world_id} 
                world={world} 
                onEnter={enterWorld}
                onToggle={toggleWorld}
              />
            ))}
          </AnimatePresence>
          
          {worlds.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-32 bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center text-center"
            >
              <Zap className="w-16 h-16 text-indigo-500/20 mb-6" />
              <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tighter">No Active Ecosystems</h3>
              <p className="text-gray-500 mt-2 mb-8 max-w-sm">Be the first to deploy a world and earn MON tokens from agent interactions.</p>
              <button 
                onClick={() => setShowCreate(true)}
                className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
              >
                Create First World
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Create World Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter">New Ecosystem</h3>
                <p className="text-gray-400 mb-8 font-medium">Configure the parameters for your virtual world.</p>
                
                <form onSubmit={handleCreateWorld} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">World Name</label>
                    <input 
                      required
                      type="text" 
                      value={newWorld.name}
                      onChange={(e) => setNewWorld({...newWorld, name: e.target.value})}
                      placeholder="e.g. Neo Tokyo Sim"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Entry Fee (MON)</label>
                    <input 
                      required
                      type="number" 
                      value={newWorld.entry_fee}
                      onChange={(e) => setNewWorld({...newWorld, entry_fee: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="flex-grow py-4 bg-white/5 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isCreating}
                      className="flex-grow py-4 bg-indigo-500 text-white rounded-xl font-black transition-all hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Launch World'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
