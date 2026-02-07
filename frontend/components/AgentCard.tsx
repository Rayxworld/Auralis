'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Zap, Package, Info, Shield, Target, TrendingUp, User } from 'lucide-react'
import { Agent } from '@/lib/api'

interface AgentCardProps {
  agent: Agent
}

const AgentCard = forwardRef<HTMLDivElement, AgentCardProps>(
  ({ agent }, ref) => {
    const isProfitable = (agent?.profit_loss || 0) >= 0
    const agentType = agent?.type?.toLowerCase() || 'simple'
    
    const typeIcons: Record<string, any> = {
      cautious: <Shield className="w-4 h-4 text-blue-400" />,
      aggressive: <Zap className="w-4 h-4 text-red-400" />,
      trend: <TrendingUp className="w-4 h-4 text-green-400" />,
      simple: <User className="w-4 h-4 text-gray-400" />,
    }

    return (
      <motion.div 
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card p-6 flex flex-col relative overflow-hidden group h-full"
      >
        {/* Background Glow */}
        <div className={`absolute -right-10 -top-10 w-32 h-32 blur-3xl opacity-10 transition-colors duration-500 ${
          agentType === 'aggressive' ? 'bg-red-500' : 
          agentType === 'cautious' ? 'bg-blue-500' : 'bg-indigo-500'
        }`} />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
              {typeIcons[agentType] || <Target className="w-6 h-6 text-indigo-400" />}
            </div>
            <div>
              <h4 className="text-lg font-black text-white uppercase tracking-tighter leading-none">{agent?.name || 'Unknown'}</h4>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{agentType} Agent</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            isProfitable ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {isProfitable ? '+' : ''}{(agent?.profit_loss || 0).toFixed(1)}%
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1 font-mono">Equity</div>
            <div className="text-sm font-black text-white italic">${agent.portfolio_value.toFixed(2)}</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1 font-mono">Actions</div>
            <div className="text-sm font-black text-white italic">{agent.action_count}</div>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Resources</span>
            <div className="h-[1px] flex-grow mx-4 bg-white/5" />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Mats', icon: <Package className="w-3 h-3 text-amber-400" />, value: agent.resources?.materials || 0 },
              { label: 'Energy', icon: <Zap className="w-3 h-3 text-blue-400" />, value: agent.resources?.energy || 0 },
              { label: 'Info', icon: <Info className="w-3 h-3 text-purple-400" />, value: agent.resources?.information || 0 },
            ].map((res) => (
              <div key={res.label} className="flex flex-col items-center p-2 bg-black/20 rounded-lg border border-white/5">
                <div className="mb-1">{res.icon}</div>
                <div className="text-[10px] font-black text-white">{res.value.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Indicator */}
        <div className="mt-auto pt-6 flex items-center justify-between">
          <div className="flex space-x-1">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-1 h-3 rounded-full ${i <= (agent.success_rate / 25) ? 'bg-indigo-500' : 'bg-white/10'}`} />
            ))}
          </div>
          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
            {agent.success_rate.toFixed(1)}% SUCCESS
          </span>
        </div>
      </motion.div>
    )
  }
)

AgentCard.displayName = 'AgentCard'

export default AgentCard
