'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Globe, Users, Coins, ArrowRight, Play, Square } from 'lucide-react'
import { World } from '@/lib/api'

interface WorldCardProps {
  world: World
  onEnter: (worldId: string) => void
  onToggle: (worldId: string, running: boolean) => void
}

const WorldCard = forwardRef<HTMLDivElement, WorldCardProps>(
  ({ world, onEnter, onToggle }, ref) => {
    return (
      <motion.div 
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card group overflow-hidden flex flex-col h-full"
      >
        <div className="h-40 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent p-6 relative">
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${world.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {world.running ? 'Running' : 'Paused'}
              </span>
            </div>
          </div>
          <Globe className="w-10 h-10 text-indigo-400 mb-2" />
          <h3 className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tighter">
            {world.name}
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            Created by <span className="text-indigo-400/80">{world.creator.slice(0, 10)}...</span>
          </p>
        </div>

        <div className="p-6 flex-grow">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-gray-500 uppercase tracking-widest text-[9px] font-bold">
                <Coins className="w-3 h-3" />
                <span>Entry Fee</span>
              </div>
              <div className="text-xl font-black text-white italic">
                {world.entry_fee} <span className="text-xs text-indigo-400">MON</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-gray-500 uppercase tracking-widest text-[9px] font-bold">
                <Users className="w-3 h-3" />
                <span>Capacity</span>
              </div>
              <div className="text-xl font-black text-white italic">
                {world.active_agents}<span className="text-gray-600">/</span>{world.max_agents}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-auto">
            <button 
              onClick={() => onEnter(world.world_id)}
              className="flex-grow py-3 bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              Enter Simulation
            </button>
            <button 
              onClick={() => onToggle(world.world_id, world.running)}
              className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all active:scale-95"
            >
              {world.running ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
            Created {new Date(world.created_at).toLocaleDateString()}
          </span>
          <ArrowRight className="w-3 h-3 text-gray-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>
    )
  }
)

WorldCard.displayName = 'WorldCard'

export default WorldCard
