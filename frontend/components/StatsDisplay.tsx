'use client'

import { useEffect, useState } from 'react'

export default function StatsDisplay() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalTrades: 0,
    totalPnL: 0,
    avgWinRate: 0
  })
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/simulation/agents')
      
      // Handle 500 errors when no simulation exists
      if (!res.ok) {
        setHasError(true)
        return
      }
      
      const data = await res.json()
      const agents = data.agents || []
      
      if (agents.length === 0) {
        setHasError(true)
        return
      }
      
      setHasError(false)
      const totalPnL = agents.reduce((sum: number, a: any) => sum + (a.balance - 100), 0)
      const totalTrades = agents.reduce((sum: number, a: any) => sum + (a.action_count || 0), 0)
      const avgWinRate = agents.reduce((sum: number, a: any) => sum + (a.success_rate || 0), 0) / agents.length

      setStats({
        totalAgents: agents.length,
        totalTrades,
        totalPnL,
        avgWinRate: avgWinRate * 100
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setHasError(true)
    }
  }

  if (hasError) {
    return (
      <div className="py-8">
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-xl p-8 border border-indigo-500/30 text-center backdrop-blur-sm">
          <div className="text-5xl mb-4 animate-pulse">🚀</div>
          <h3 className="text-xl font-bold mb-2">Ready to Launch</h3>
          <p className="text-gray-400 mb-4">No simulation running yet. Create one to see live stats!</p>
          <a href="/dashboard" className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold hover:opacity-90 transition">
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
      <div className="group bg-gradient-to-br from-indigo-600/10 to-indigo-600/5 rounded-xl p-6 border border-indigo-500/20 text-center hover:border-indigo-500/50 transition-all hover:scale-105 cursor-pointer">
        <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Active Agents</div>
        <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent animate-pulse">{stats.totalAgents}</div>
      </div>
      
      <div className="group bg-gradient-to-br from-purple-600/10 to-purple-600/5 rounded-xl p-6 border border-purple-500/20 text-center hover:border-purple-500/50 transition-all hover:scale-105 cursor-pointer">
        <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Total Trades</div>
        <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.totalTrades}</div>
      </div>
      
      <div className="group bg-gradient-to-br from-green-600/10 to-green-600/5 rounded-xl p-6 border border-green-500/20 text-center hover:border-green-500/50 transition-all hover:scale-105 cursor-pointer">
        <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Total P&L</div>
        <div className={`text-4xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
        </div>
      </div>
      
      <div className="group bg-gradient-to-br from-pink-600/10 to-pink-600/5 rounded-xl p-6 border border-pink-500/20 text-center hover:border-pink-500/50 transition-all hover:scale-105 cursor-pointer">
        <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Avg Win Rate</div>
        <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">{stats.avgWinRate.toFixed(1)}%</div>
      </div>
    </div>
  )
}
