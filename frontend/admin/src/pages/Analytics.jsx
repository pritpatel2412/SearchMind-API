import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Cpu, Server, Activity, ArrowUpRight, Calendar, ArrowDownRight, Globe, Layers, Loader, AlertTriangle } from 'lucide-react'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('12h')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const res = await fetch('http://localhost:8000/v1/admin/analytics')
        if (!res.ok) throw new Error('Failed to fetch platform analytics')
        const json = await res.json()
        setData(json)
        setError('')
      } catch (e) {
        console.error(e)
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  const metrics = [
    { 
      title: 'Total API Volume', 
      value: data ? data.cumulative_vol.toLocaleString() : '0', 
      change: '+12.4%', 
      status: 'up', 
      icon: TrendingUp, 
      color: '#3b9eff', 
      detail: 'Cumulative request volume' 
    },
    { 
      title: 'Cache Hit Ratio', 
      value: data ? `${data.cache_hit_ratio}%` : '0%', 
      change: '+3.1%', 
      status: 'up', 
      icon: Server, 
      color: '#11ff99', 
      detail: 'Percentage of cached hits' 
    },
    { 
      title: 'Average Latency', 
      value: data ? `${data.avg_latency_ms} ms` : '0 ms', 
      change: '-8.2%', 
      status: 'down', 
      icon: Activity, 
      color: '#ffc53d', 
      detail: 'Avg response time' 
    },
    { 
      title: 'Error Rate (5xx)', 
      value: data ? `${data.error_rate}%` : '0%', 
      change: '-0.02%', 
      status: 'down', 
      icon: Cpu, 
      color: '#ff2047', 
      detail: 'Worker timeouts' 
    }
  ]

  const queryPoints = data ? data.query_sparkline : [30, 45, 38, 55, 62, 78, 70, 85, 92, 88, 105, 120]
  const latencyPoints = data ? data.latency_sparkline : [220, 190, 210, 160, 150, 140, 135, 138, 150, 145, 140, 130]

  const providers = data ? data.providers : [
    { name: 'Brave Search', share: 72, volume: '111,045', latency: '94ms', status: 'healthy', color: 'bg-accent-blue' },
    { name: 'SerpAPI Fallback', share: 21, volume: '32,388', latency: '412ms', status: 'degraded', color: 'bg-accent-orange' },
    { name: 'DuckDuckGo Fallover', share: 7, volume: '10,797', latency: '608ms', status: 'healthy', color: 'bg-mute' }
  ]

  const timeLabels = data ? data.time_labels : ['22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00']

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto relative glow-blue">
      
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-4xl font-display font-medium text-ink flex items-center gap-2">
            Platform Analytics
          </h1>
          <p className="text-xs font-sans text-mute mt-1">
            Real-time analytics engine tracking query distributions, latencies, and service fallbacks.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex gap-1 bg-surface-deep border border-hairline-strong rounded-md p-1 text-xs font-sans font-medium">
          {['1h', '12h', '24h', '7d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded transition-all ${
                timeRange === range
                  ? 'bg-surface-elevated text-ink border border-hairline-strong shadow-sm'
                  : 'text-mute hover:text-ink'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-accent-red/5 border border-accent-red/20 rounded-lg flex items-start gap-3 text-accent-red font-sans text-xs z-10 relative">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block uppercase tracking-wider text-[10px]">Telemetry Connection Degraded</span>
            <p className="text-ink/80 leading-relaxed">
              Failed to query telemetry logs: <span className="font-mono text-accent-red bg-accent-red/10 px-1 rounded">{error}</span>. Please verify that the SearchMind API server is running on port 8000.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-4 font-mono z-10 relative">
          <Loader className="animate-spin text-accent-blue" size={24} />
          <p className="text-[11px] text-mute">Loading active platform telemetry...</p>
        </div>
      ) : (
        <>
          {/* METRICS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {metrics.map((m) => {
          const Icon = m.icon
          const isUp = m.status === 'up'
          const isLatency = m.title === 'Average Latency'
          
          return (
            <div key={m.title} className="bg-surface-card border border-hairline-strong p-5 rounded-lg flex items-center justify-between hover:bg-surface-elevated transition-colors">
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-medium tracking-[0.8px] text-mute uppercase">{m.title}</span>
                <p className="text-2xl font-bold font-sans tracking-tight text-ink mt-1">{m.value}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-sans mt-1">
                  <span className={`inline-flex items-center gap-0.5 font-semibold ${
                    isLatency 
                      ? 'text-accent-green' 
                      : isUp ? 'text-accent-green' : 'text-accent-red'
                  }`}>
                    {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {m.change}
                  </span>
                  <span className="text-mute">{m.detail}</span>
                </div>
              </div>
              <div 
                className="p-2.5 rounded bg-surface-deep border border-hairline text-ink"
              >
                <Icon size={14} style={{ color: m.color }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* CHART GRAPHICS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* CHART 1: Query Volume */}
        <div className="bg-surface-card border border-hairline-strong p-6 rounded-lg space-y-6">
          <div className="flex justify-between items-center border-b border-hairline pb-4">
            <div>
              <h3 className="font-semibold text-ink font-display text-base">Query Volume Stream</h3>
              <p className="text-[10px] text-mute font-mono mt-0.5">Average query volume segmented in 15min divisions</p>
            </div>
            <span className="px-2 py-0.5 bg-surface-deep border border-hairline rounded font-mono text-[9px] font-bold text-mute uppercase">
              10K Reqs / div
            </span>
          </div>

          {/* SVG Line/Area Graph */}
          <div className="h-64 w-full bg-surface-deep rounded-md relative border border-hairline overflow-hidden p-2">
            
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}
            ></div>

            <svg className="w-full h-full relative z-10" viewBox="0 0 400 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b9eff" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b9eff" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="3" />

              <path
                d={`M 0 100 L ${queryPoints.map((val, i) => `${(i / (queryPoints.length - 1)) * 400} ${100 - val * 0.7}`).join(' L ')} L 400 100 Z`}
                fill="url(#blueGlow)"
              />
              <path
                d={queryPoints.map((val, i) => `${i === 0 ? 'M' : 'L'} ${(i / (queryPoints.length - 1)) * 400} ${100 - val * 0.7}`).join(' ')}
                fill="none"
                stroke="#3b9eff"
                strokeWidth="1.2"
              />
            </svg>
          </div>

          <div className="flex justify-between px-2 font-mono text-[9px] text-mute">
            {timeLabels.filter((_, idx) => idx % 2 === 0).map((lbl) => (
              <span key={lbl}>{lbl}</span>
            ))}
          </div>
        </div>

        {/* CHART 2: Response Latencies */}
        <div className="bg-surface-card border border-hairline-strong p-6 rounded-lg space-y-6">
          <div className="flex justify-between items-center border-b border-hairline pb-4">
            <div>
              <h3 className="font-semibold text-ink font-display text-base">Response Latency Profile</h3>
              <p className="text-[10px] text-mute font-mono mt-0.5">Average millisecond request response cycle</p>
            </div>
            <span className="px-2 py-0.5 bg-surface-deep border border-hairline rounded font-mono text-[9px] font-bold text-mute uppercase">
              Target: &lt; 150ms
            </span>
          </div>

          <div className="h-64 w-full bg-surface-deep rounded-md relative border border-hairline overflow-hidden p-2">
            
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}
            ></div>

            <svg className="w-full h-full relative z-10" viewBox="0 0 400 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="orangeGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff801f" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ff801f" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="3" />

              <path
                d={`M 0 100 L ${latencyPoints.map((val, i) => `${(i / (latencyPoints.length - 1)) * 400} ${100 - (val / 300) * 80}`).join(' L ')} L 400 100 Z`}
                fill="url(#orangeGlow)"
              />
              <path
                d={latencyPoints.map((val, i) => `${i === 0 ? 'M' : 'L'} ${(i / (latencyPoints.length - 1)) * 400} ${100 - (val / 300) * 80}`).join(' ')}
                fill="none"
                stroke="#ff801f"
                strokeWidth="1.2"
              />
            </svg>
          </div>

          <div className="flex justify-between px-2 font-mono text-[9px] text-mute">
            {timeLabels.filter((_, idx) => idx % 2 === 0).map((lbl) => (
              <span key={lbl}>{lbl}</span>
            ))}
          </div>
        </div>

      </div>

      {/* PROVIDER FALLBACK SEGMENTATION PANEL */}
      <div className="bg-surface-card border border-hairline-strong p-6 rounded-lg space-y-6 relative z-10">
        
        <div className="border-b border-hairline pb-4">
          <h3 className="font-semibold text-ink font-display text-base">Search Provider Fallback Share</h3>
          <p className="text-[10px] text-mute font-mono mt-0.5">
            Distribution of upstream API queries hitting primary and fallback endpoints.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-4 bg-surface-deep rounded border border-hairline overflow-hidden flex font-mono text-[9px] font-bold">
            {providers.map((p) => (
              <div 
                key={p.name}
                className={`${p.color} h-full transition-all duration-500 hover:brightness-110 flex items-center justify-center text-canvas`}
                style={{ width: `${p.share}%` }}
                title={`${p.name}: ${p.share}% share`}
              >
                {p.share > 10 && `${p.share}%`}
              </div>
            ))}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providers.map((p) => (
              <div key={p.name} className="p-4 bg-surface-deep border border-hairline rounded flex flex-col justify-between hover:bg-surface-card transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${p.color}`}></span>
                    <span className="font-bold text-xs text-ink">{p.name}</span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase border ${
                    p.status === 'healthy' 
                      ? 'text-accent-green bg-accent-green/5 border-accent-green/20' 
                      : 'text-accent-orange bg-accent-orange/5 border-accent-orange/20'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex justify-between items-baseline mt-2 font-mono">
                  <div className="text-left">
                    <span className="text-[9px] text-mute uppercase block">Queries mapped</span>
                    <span className="text-sm font-bold text-ink">{p.volume}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-mute uppercase block">Avg latency</span>
                    <span className="text-xs font-bold text-ink">{p.latency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      </>
      )}

    </div>
  )
}
