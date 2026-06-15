import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Cpu, Server, Activity, ArrowUpRight, Calendar, ArrowDownRight, Globe, Layers, Loader, AlertTriangle, HelpCircle } from 'lucide-react'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('12h')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Interactive hover states
  const [hoveredQueryIdx, setHoveredQueryIdx] = useState(null)
  const [hoveredLatencyIdx, setHoveredLatencyIdx] = useState(null)

  // Helper to scale points between min and max dynamically to fit the SVG viewbox (height=100)
  const getScaledY = (val, points, paddingBottom = 15, paddingTop = 15) => {
    if (!points || points.length === 0) return 85
    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min
    if (range === 0) {
      // If all values are 0, draw at the bottom (Y=85)
      return val === 0 ? 85 : 50
    }
    
    // Scale val between Y=85 (bottom, corresponding to min) and Y=15 (top, corresponding to max)
    const usableHeight = 100 - paddingBottom - paddingTop
    return 100 - paddingBottom - ((val - min) / range) * usableHeight
  }

  // Helper to scale X points safely
  const getX = (i, total) => {
    if (total <= 1) return 200
    return (i / (total - 1)) * 400
  }

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('adminToken')
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
        const res = await fetch(`${apiUrl}/v1/admin/analytics?time_range=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
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
  }, [timeRange])

  const metrics = [
    { 
      title: 'Total API Volume', 
      value: data ? data.cumulative_vol.toLocaleString() : '0', 
      icon: TrendingUp, 
      color: '#3b9eff', 
      detail: 'Cumulative requests' 
    },
    { 
      title: 'Cache Hit Ratio', 
      value: data ? `${data.cache_hit_ratio}%` : '0%', 
      icon: Server, 
      color: '#10b981', 
      detail: 'From Redis store' 
    },
    { 
      title: 'Average Latency', 
      value: data ? `${data.avg_latency_ms} ms` : '0 ms', 
      icon: Activity, 
      color: '#FBC400', 
      detail: 'Average response cycle' 
    },
    { 
      title: 'Error Rate (5xx)', 
      value: data ? `${data.error_rate}%` : '0%', 
      icon: Cpu, 
      color: '#ef4444', 
      detail: 'HTTP status exceptions' 
    }
  ]

  const queryPoints = data ? data.query_sparkline : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  const latencyPoints = data ? data.latency_sparkline : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  const timeLabels = data ? data.time_labels : ['', '', '', '', '', '', '', '', '', '', '', '']
  const providers = data ? data.providers : []

  // Check if sparklines contain any data
  const hasQueryData = queryPoints && queryPoints.some(val => val > 0)
  const hasLatencyData = latencyPoints && latencyPoints.some(val => val > 0)

  const queryPathD = queryPoints.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, queryPoints.length)} ${getScaledY(val, queryPoints)}`).join(' ')
  const queryAreaD = `M 0 100 L ${queryPoints.map((val, i) => `${getX(i, queryPoints.length)} ${getScaledY(val, queryPoints)}`).join(' L ')} L 400 100 Z`

  const latencyPathD = latencyPoints.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, latencyPoints.length)} ${getScaledY(val, latencyPoints)}`).join(' ')
  const latencyAreaD = `M 0 100 L ${latencyPoints.map((val, i) => `${getX(i, latencyPoints.length)} ${getScaledY(val, latencyPoints)}`).join(' L ')} L 400 100 Z`

  const getProviderStatus = (p) => {
    if (p.volume === 0) return 'inactive'
    if (p.latency < 400) return 'healthy'
    return 'slow'
  }

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto relative overflow-hidden">
      
      {/* Background ambient lighting glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-blue/3 blur-[120px] pointer-events-none z-0"></div>

      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 border-b border-hairline pb-6">
        <div>
          <h1 className="text-heading-1 text-ink flex items-center gap-2 font-light">
            Platform Analytics
          </h1>
          <p className="text-caption text-slate mt-1">
            Real-time analytics engine tracking query distributions, latencies, and service fallbacks from the database.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex gap-1 bg-[#131311] border border-hairline p-1 rounded-lg text-xs font-sans font-medium h-[38px] items-center">
          {['1h', '12h', '24h', '7d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md transition-all border cursor-pointer ${
                timeRange === range
                  ? 'bg-[#1e1e1a] text-primary border-hairline-strong shadow-md font-bold'
                  : 'text-slate border-transparent hover:text-ink'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-accent-red/5 border border-accent-red/20 rounded-xl flex items-start gap-3.5 text-accent-red font-sans text-xs z-10 relative">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block uppercase tracking-wider text-[10px]">Telemetry Connection Degraded</span>
            <p className="text-ink/80 leading-relaxed">
              Failed to query telemetry logs: <span className="font-mono text-accent-red bg-accent-red/10 px-1.5 py-0.5 rounded">{error}</span>. Verify that the SearchMind API server is running on port 8000.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-center p-6 space-y-4 font-mono z-10 relative">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-[11px] text-slate">Loading active platform telemetry...</p>
        </div>
      ) : (
        <>
          {/* METRICS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
            {metrics.map((m) => {
              const Icon = m.icon
              return (
                <div key={m.title} className="bg-[#0e0e0d]/70 backdrop-blur-md border border-hairline p-5 rounded-2xl flex items-center justify-between hover:border-hairline-strong transition-all shadow-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate uppercase tracking-wider block">{m.title}</span>
                    <p className="text-heading-3 text-ink mt-1 font-semibold">{m.value}</p>
                    <div className="flex items-center gap-1.5 text-[10.5px] font-mono mt-1 text-slate">
                      <span>{m.detail}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c0c0b] border border-hairline text-ink" style={{ color: m.color }}>
                    <Icon size={15} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* CHART GRAPHICS CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
            
            {/* CHART 1: Query Volume */}
            <div className="bg-[#0e0e0d]/70 backdrop-blur-md border border-hairline p-6 rounded-2xl space-y-6 shadow-xl text-left">
              <div className="flex justify-between items-center border-b border-hairline pb-4">
                <div>
                  <h3 className="text-heading-5 text-ink font-semibold">Query Volume Stream</h3>
                  <p className="text-[10px] text-slate font-mono mt-0.5">Average query volume segmented in divisions</p>
                </div>
                <span className="px-2.5 py-0.5 bg-[#121210] border border-hairline rounded-md font-mono text-[9px] font-bold text-slate uppercase">
                  Real Telemetry
                </span>
              </div>

              {/* SVG Line/Area Graph */}
              <div className="h-64 w-full bg-[#0a0a09]/50 rounded-xl relative border border-hairline overflow-hidden p-2 flex flex-col justify-between">
                
                <div 
                  className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                  }}
                ></div>

                {!hasQueryData && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#0a0a09]/20 backdrop-blur-[1px] z-30">
                    <span className="text-[10px] font-mono text-steel uppercase tracking-wider font-bold mb-1">No Activity Detected</span>
                    <span className="text-[10px] text-slate max-w-[200px] leading-relaxed">No search requests logged in this database window.</span>
                  </div>
                )}

                {hoveredQueryIdx !== null && hasQueryData && (
                  <div 
                    className="absolute bg-[#121210]/95 backdrop-blur border border-hairline-strong rounded-lg px-2.5 py-1.5 pointer-events-none z-20 text-[10px] font-mono shadow-xl text-ink"
                    style={{
                      left: `${(hoveredQueryIdx / (queryPoints.length - 1)) * 100}%`,
                      transform: `translateX(${hoveredQueryIdx / (queryPoints.length - 1) > 0.8 ? '-90%' : hoveredQueryIdx / (queryPoints.length - 1) < 0.2 ? '10%' : '-50%'})`,
                      top: '12px',
                    }}
                  >
                    <div className="text-slate border-b border-hairline pb-0.5 mb-1 font-bold">{timeLabels[hoveredQueryIdx] || ''}</div>
                    <div className="font-bold text-[#3b9eff]">{queryPoints[hoveredQueryIdx].toLocaleString()} queries</div>
                  </div>
                )}

                <svg className="w-full h-full relative z-10" viewBox="0 0 400 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b9eff" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#3b9eff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3" />

                  {/* Vertical guideline on hover */}
                  {hoveredQueryIdx !== null && hasQueryData && (
                    <line
                      x1={getX(hoveredQueryIdx, queryPoints.length)}
                      y1={0}
                      x2={getX(hoveredQueryIdx, queryPoints.length)}
                      y2={100}
                      stroke="rgba(59, 158, 255, 0.3)"
                      strokeWidth="1"
                      strokeDasharray="2"
                    />
                  )}

                  {hasQueryData && (
                    <>
                      <path d={queryAreaD} fill="url(#blueGlow)" />
                      <path d={queryPathD} fill="none" stroke="#3b9eff" strokeWidth="1.5" />
                    </>
                  )}

                  {/* Highlight dot on hover */}
                  {hoveredQueryIdx !== null && hasQueryData && (
                    <circle
                      cx={getX(hoveredQueryIdx, queryPoints.length)}
                      cy={getScaledY(queryPoints[hoveredQueryIdx], queryPoints)}
                      r="4"
                      fill="#3b9eff"
                      stroke="#0C0C0B"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Interactive Hover Targets */}
                  {queryPoints.map((_, i) => {
                    const total = queryPoints.length
                    const width = 400 / total
                    const x = getX(i, total) - width / 2
                    return (
                      <rect
                        key={i}
                        x={Math.max(0, x)}
                        y={0}
                        width={width}
                        height={100}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredQueryIdx(i)}
                        onMouseLeave={() => setHoveredQueryIdx(null)}
                      />
                    )
                  })}
                </svg>
              </div>

              <div className="flex justify-between px-2 font-mono text-[9px] text-slate select-none">
                {timeLabels.filter((_, idx) => idx % 2 === 0).map((lbl, idx) => (
                  <span key={idx}>{lbl}</span>
                ))}
              </div>
            </div>

            {/* CHART 2: Response Latencies */}
            <div className="bg-[#0e0e0d]/70 backdrop-blur-md border border-hairline p-6 rounded-2xl space-y-6 shadow-xl text-left">
              <div className="flex justify-between items-center border-b border-hairline pb-4">
                <div>
                  <h3 className="text-heading-5 text-ink font-semibold">Response Latency Profile</h3>
                  <p className="text-[10px] text-slate font-mono mt-0.5">Average millisecond request response cycle</p>
                </div>
                <span className="px-2.5 py-0.5 bg-[#121210] border border-hairline rounded-md font-mono text-[9px] font-bold text-slate uppercase">
                  Goal: &lt; 150ms
                </span>
              </div>

              <div className="h-64 w-full bg-[#0a0a09]/50 rounded-xl relative border border-hairline overflow-hidden p-2 flex flex-col justify-between">
                
                <div 
                  className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                  }}
                ></div>

                {!hasLatencyData && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#0a0a09]/20 backdrop-blur-[1px] z-30">
                    <span className="text-[10px] font-mono text-steel uppercase tracking-wider font-bold mb-1">No Activity Detected</span>
                    <span className="text-[10px] text-slate max-w-[200px] leading-relaxed">No latency metrics recorded in this database window.</span>
                  </div>
                )}

                {hoveredLatencyIdx !== null && hasLatencyData && (
                  <div 
                    className="absolute bg-[#121210]/95 backdrop-blur border border-hairline-strong rounded-lg px-2.5 py-1.5 pointer-events-none z-20 text-[10px] font-mono shadow-xl text-ink"
                    style={{
                      left: `${(hoveredLatencyIdx / (latencyPoints.length - 1)) * 100}%`,
                      transform: `translateX(${hoveredLatencyIdx / (latencyPoints.length - 1) > 0.8 ? '-90%' : hoveredLatencyIdx / (latencyPoints.length - 1) < 0.2 ? '10%' : '-50%'})`,
                      top: '12px',
                    }}
                  >
                    <div className="text-slate border-b border-hairline pb-0.5 mb-1 font-bold">{timeLabels[hoveredLatencyIdx] || ''}</div>
                    <div className="font-bold text-[#FBC400]">{latencyPoints[hoveredLatencyIdx].toFixed(1)} ms</div>
                  </div>
                )}

                <svg className="w-full h-full relative z-10" viewBox="0 0 400 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="orangeGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FBC400" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#FBC400" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3" />

                  {/* Vertical guideline on hover */}
                  {hoveredLatencyIdx !== null && hasLatencyData && (
                    <line
                      x1={getX(hoveredLatencyIdx, latencyPoints.length)}
                      y1={0}
                      x2={getX(hoveredLatencyIdx, latencyPoints.length)}
                      y2={100}
                      stroke="rgba(251, 196, 0, 0.3)"
                      strokeWidth="1"
                      strokeDasharray="2"
                    />
                  )}

                  {hasLatencyData && (
                    <>
                      <path d={latencyAreaD} fill="url(#orangeGlow)" />
                      <path d={latencyPathD} fill="none" stroke="#FBC400" strokeWidth="1.5" />
                    </>
                  )}

                  {/* Highlight dot on hover */}
                  {hoveredLatencyIdx !== null && hasLatencyData && (
                    <circle
                      cx={getX(hoveredLatencyIdx, latencyPoints.length)}
                      cy={getScaledY(latencyPoints[hoveredLatencyIdx], latencyPoints)}
                      r="4"
                      fill="#FBC400"
                      stroke="#0C0C0B"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Interactive Hover Targets */}
                  {latencyPoints.map((_, i) => {
                    const total = latencyPoints.length
                    const width = 400 / total
                    const x = getX(i, total) - width / 2
                    return (
                      <rect
                        key={i}
                        x={Math.max(0, x)}
                        y={0}
                        width={width}
                        height={100}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredLatencyIdx(i)}
                        onMouseLeave={() => setHoveredLatencyIdx(null)}
                      />
                    )
                  })}
                </svg>
              </div>

              <div className="flex justify-between px-2 font-mono text-[9px] text-slate select-none">
                {timeLabels.filter((_, idx) => idx % 2 === 0).map((lbl, idx) => (
                  <span key={idx}>{lbl}</span>
                ))}
              </div>
            </div>

          </div>

          {/* PROVIDER FALLBACK SEGMENTATION PANEL */}
          <div className="bg-[#0e0e0d]/70 backdrop-blur-md border border-hairline p-6 rounded-2xl space-y-6 relative z-10 shadow-xl text-left">
            
            <div className="border-b border-hairline pb-4">
              <h3 className="text-heading-5 text-ink font-semibold flex items-center gap-2">
                Search Provider Fallback Share
              </h3>
              <p className="text-[10px] text-slate font-mono mt-0.5">
                Distribution of upstream API queries hitting primary index (Brave) vs fallback systems.
              </p>
            </div>

            {providers.length > 0 && providers.some(p => p.volume > 0) ? (
              <div className="space-y-4">
                <div className="h-5 bg-[#121210] rounded-lg border border-hairline overflow-hidden flex font-mono text-[9px] font-bold">
                  {providers.map((p) => {
                    const share = p.share
                    let barColor = 'bg-accent-blue'
                    if (p.name.includes('SerpAPI')) barColor = 'bg-primary'
                    if (p.name.includes('DuckDuckGo')) barColor = 'bg-slate'
                    
                    return (
                      <div 
                        key={p.name}
                        className={`${barColor} h-full transition-all duration-500 hover:brightness-110 flex items-center justify-center text-canvas`}
                        style={{ width: `${share}%` }}
                        title={`${p.name}: ${share}% share`}
                      >
                        {share > 10 && `${share}%`}
                      </div>
                    )
                  })}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {providers.map((p) => {
                    const status = getProviderStatus(p)
                    let dotColor = 'bg-accent-blue'
                    if (p.name.includes('SerpAPI')) dotColor = 'bg-primary'
                    if (p.name.includes('DuckDuckGo')) dotColor = 'bg-slate'
                    
                    return (
                      <div key={p.name} className="p-4 bg-[#0c0c0b]/40 border border-hairline rounded-xl flex flex-col justify-between hover:bg-[#121210]/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                            <span className="font-bold text-xs text-ink">{p.name}</span>
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                            status === 'healthy' 
                              ? 'text-accent-green bg-accent-green/10 border-accent-green/20' 
                              : status === 'slow'
                              ? 'text-primary bg-primary/10 border-primary/20'
                              : 'text-slate bg-[#121210] border-hairline'
                          }`}>
                            {status}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline mt-2 font-mono">
                          <div className="text-left">
                            <span className="text-[9px] text-slate uppercase block">Queries mapped</span>
                            <span className="text-sm font-bold text-ink">
                              {p.volume.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate uppercase block">Avg latency</span>
                            <span className="text-xs font-bold text-ink">
                              {p.latency}ms
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center p-6 space-y-3 font-mono border border-dashed border-hairline rounded-xl">
                <HelpCircle className="text-slate" size={20} />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate uppercase font-bold tracking-wider">No Provider Logs Found</span>
                  <p className="text-[10px] text-steel max-w-xs">Upstream fallback shares will compute automatically as queries occur.</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  )
}
