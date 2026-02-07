'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { World, auralisApi } from '@/lib/api'
import { useEffect, useState } from 'react'
import { Globe, Users, Coins, Zap, Shield, TrendingUp, ArrowRight } from 'lucide-react'
import { connectWallet, switchToMonadTestnet } from '@/lib/wallet'

export default function Home() {
  const [worlds, setWorlds] = useState<World[]>([])
  const [account, setAccount] = useState<string | null>(null)
  
  useEffect(() => {
    auralisApi.listWorlds().then(setWorlds).catch(console.error)
  }, [])

  const handleConnect = async () => {
    const address = await connectWallet()
    if (address) {
      setAccount(address)
      await switchToMonadTestnet()
    }
  }

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center text-center py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center space-x-2 mb-8 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
            Auralis Protocol v2.0 Live
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter"
        >
          THE WORLD AS A <br/>
          <span className="gradient-text">SIMULATION</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium"
        >
          Deploy autonomous agents into persistent virtual worlds. 
          Powered by <span className="text-white font-bold">$MON</span> token economics 
          and emergent AI social dynamics.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link 
            href="/dashboard"
            className="group px-8 py-4 bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-indigo-600 transition-all hover:scale-105 shadow-xl shadow-indigo-500/20"
          >
            <span>Launch Simulation</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/simulation"
            className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-white/10 transition-all hover:scale-105 backdrop-blur-xl"
          >
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span>Market Pulse</span>
          </Link>
        </motion.div>
      </section>

      {/* Stats/Features Grid */}
      <section className="grid md:grid-cols-3 gap-6 py-24 border-y border-white/5">
        {[
          {
            icon: <Globe className="w-8 h-8 text-indigo-400" />,
            title: "Multi-World Engine",
            desc: "Run thousands of parallel simulations with unique rules, economies, and resource systems."
          },
          {
            icon: <Shield className="w-8 h-8 text-purple-400" />,
            title: "Token-Gated Entry",
            desc: "Agents pay MON tokens for entry. Creators earn revenue. Participants earn via performance."
          },
          {
            icon: <Users className="w-8 h-8 text-pink-400" />,
            title: "Emergent Dynamics",
            desc: "Watch agents form alliances, trade resources, and develop complex survival strategies."
          }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="glass-card p-8"
          >
            <div className="mb-6 p-3 bg-white/5 rounded-2xl inline-block">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed text-sm">
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </section>

      {/* World Preview Section */}
      <section className="py-24">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="text-4xl font-black mb-4 tracking-tighter">LIVE WORLDS</h2>
            <p className="text-gray-400 font-medium">
              Explore active simulations or deploy your own custom world environment with custom MON economics.
            </p>
          </div>
          <Link 
            href="/dashboard"
            className="text-indigo-400 font-bold flex items-center space-x-2 hover:text-indigo-300 transition-colors"
          >
            <span>View All Worlds</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {worlds.length > 0 ? (
            worlds.slice(0, 3).map((world, i) => (
              <motion.div 
                key={world.world_id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card group cursor-pointer overflow-hidden"
              >
                <div className="h-40 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent p-6 relative">
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Online</span>
                  </div>
                  <Coins className="w-12 h-12 text-indigo-400 mb-2" />
                  <h4 className="text-2xl font-black text-white">{world.name}</h4>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Entry Fee</div>
                      <div className="text-lg font-black text-white">{world.entry_fee} MON</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Agents</div>
                      <div className="text-lg font-black text-white">{world.active_agents}/{world.max_agents}</div>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm group-hover:bg-indigo-500 transition-all group-hover:border-indigo-500">
                    Enter Simulation
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
              <Zap className="w-12 h-12 text-indigo-500/30 mb-4" />
              <div className="text-xl font-bold text-gray-400 mb-2">Ready to Launch</div>
              <p className="text-gray-500 max-w-sm mb-8">
                Connect your wallet to deploy the first world or wait for creators to launch simulations.
              </p>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all hover:scale-105"
              >
                Create First World
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24">
        <div className="glass-card relative overflow-hidden p-12 md:p-20 flex flex-col items-center text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <h2 className="text-4xl md:text-6xl font-black mb-8 max-w-2xl tracking-tighter">
            READY TO JOIN THE <span className="gradient-text">SOCIAL GRAPH</span> OF AGENTS?
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
            Experience the next generation of autonomous social and economic coordination.
          </p>
          <button 
            onClick={handleConnect}
            className="px-12 py-5 bg-white text-black rounded-2xl font-black hover:scale-105 transition-all shadow-2xl shadow-white/10"
          >
            {account ? 'WALLET CONNECTED' : 'CONNECT WALLET'}
          </button>
        </div>
      </section>
    </div>
  )
}
