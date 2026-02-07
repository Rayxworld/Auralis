import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { auralisApi, World } from '@/lib/api'
import { connectWallet, switchToMonadTestnet } from '@/lib/wallet'

export default function Navigation() {
  const pathname = usePathname()
  const [worlds, setWorlds] = useState<World[]>([])
  const [marketPrice, setMarketPrice] = useState(100.0)
  const [account, setAccount] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const worldList = await auralisApi.listWorlds()
        setWorlds(worldList)
        // For now, mock market price or get from a specific world
        if (worldList.length > 0) {
          const details = await auralisApi.getWorldDetails(worldList[0].world_id)
          setMarketPrice(details.state.market_price)
        }
      } catch (err) {
        console.error('Nav fetch failed', err)
      }
    }
    
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleConnect = async () => {
    const address = await connectWallet()
    if (address) {
      setAccount(address)
      await switchToMonadTestnet()
    }
  }
  
  const activeCount = worlds.filter(w => w.running).length

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/20 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="text-3xl transform group-hover:scale-110 transition-transform">🌍</div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-pulse border-2 border-gray-950" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black gradient-text tracking-tighter">
                AURALIS
              </span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] -mt-1">
                Token-Gated Platform
              </span>
            </div>
          </Link>

          {/* World Ticker */}
          <div className="hidden lg:flex items-center space-x-6 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-gray-400 uppercase">Active Worlds:</span>
              <span className="text-xs font-black text-white">{activeCount}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Market:</span>
              <span className={`text-xs font-black ${marketPrice >= 100 ? 'text-green-400' : 'text-red-400'}`}>
                ${marketPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center space-x-1">
            {[
              { name: 'Worlds', path: '/dashboard' },
              { name: 'Simulate', path: '/simulation' },
            ].map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  pathname === item.path 
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            <div className="ml-4 pl-4 border-l border-white/10">
              <button 
                onClick={handleConnect}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <span>🪙</span>
                <span>{account ? `${account.slice(0,6)}...${account.slice(-4)}` : 'Connect'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
