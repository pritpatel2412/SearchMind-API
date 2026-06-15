import React, { useState, useEffect, useRef } from 'react'
import { Activity, Server, Cpu, Database, RefreshCw, Terminal, CheckCircle2, XCircle, AlertTriangle, Play, Trash2, Send, X } from 'lucide-react'

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState([])
  
  const terminalEndRef = useRef(null)

  const formatUptime = (seconds) => {
    if (!seconds) return '0s'
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    
    const parts = []
    if (d > 0) parts.push(`${d}d`)
    if (h > 0) parts.push(`${h}h`)
    if (m > 0) parts.push(`${m}m`)
    if (s > 0 || parts.length === 0) parts.push(`${s}s`)
    return parts.join(' ')
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i]
  }

  const fetchHealth = async () => {
    setLoading(true)
    setError('')
    addLog('info', 'Executing platform-wide heartbeat liveness probe...')
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/v1/admin/health`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Health check endpoint returned status ' + res.status)
      const data = await res.json()
      setHealth(data)
      addLog('success', `Heartbeat check passed. status=${data.status || 'healthy'} database=[latency:${data?.database?.details?.latency_ms || 0}ms conns:${data?.database?.details?.active_connections || 0}] redis=[keys:${data?.redis?.details?.keys_stored || 0} mem:${formatBytes(data?.redis?.details?.memory_used_bytes)}]`)
    } catch (e) {
      setError(e.message)
      setHealth({
        status: 'degraded',
        api: { status: 'ok', details: { host: 'Uvicorn FastAPI Worker', uptime_seconds: 0, workers: 4, version: '1.0.0' } },
        database: { status: 'error', details: { error: e.message } },
        redis: { status: 'error', details: { error: e.message } }
      })
      addLog('error', `Heartbeat probe degraded. Error: ${e.message}. Failover mode enabled.`)
    } finally {
      setLoading(false)
    }
  }

  const addLog = (type, text) => {
    setLogs(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type,
        text,
        time: new Date().toLocaleTimeString()
      }
    ])
  }

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 15000)
    return () => clearInterval(interval)
  }, [])

  const simulateAction = (actionType) => {
    switch (actionType) {
      case 'ping_db':
        addLog('info', 'Probing PostgreSQL cluster active connections pool...')
        setTimeout(() => {
          addLog('success', 'PostgreSQL check successful: client count=8/20, active_dialect=asyncpg')
        }, 300)
        break
      case 'flush_redis':
        addLog('info', 'Command received: FLUSHDB RateLimit cache keys...')
        setTimeout(() => {
          addLog('success', 'Redis store flushed. Mapped key count reset to 0. Hot cache indexes ready.')
        }, 500)
        break
      case 'query_test':
        addLog('info', 'Simulating standard POST /v1/search agent request routing...')
        setTimeout(() => {
          addLog('success', 'Query successfully processed: cache_hit=true latency=8ms routing_path=redis_hot')
        }, 400)
        break
      case 'error_event':
        addLog('warning', 'SIMULATED EVENT: Remote Brave API rate limit warning (HTTP 429). Triggering SerpAPI fallback routing.')
        break
      case 'clear_logs':
        setLogs([{ id: 1, type: 'info', text: 'Logs terminal console cleared.', time: new Date().toLocaleTimeString() }])
        break
      default:
        break
    }
  }

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto relative glow-orange">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-heading-1 text-ink flex items-center gap-2">
            System Health
          </h1>
          <p className="text-caption text-slate mt-1">
            Real-time infrastructure health node checkpoints and active connector checks.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="button-cream text-xs font-sans font-medium h-[38px] px-4"
        >
          <RefreshCw size={11} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Force Diagnostic
        </button>
      </div>

      {/* Alert Banner */}
      {error && (
        <div className="p-4 bg-accent-red/5 border border-accent-red/20 rounded-lg flex items-start gap-3 text-accent-red font-sans text-xs z-10 relative">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block uppercase tracking-wider text-[10px]">Heartbeat Connection Degraded</span>
            <p className="text-ink/80 leading-relaxed">
              Heartbeat check failed: <span className="font-mono text-accent-red bg-accent-red/10 px-1 rounded">{error}</span>. Please verify that your local FastAPI server is running on port 8000. PostgreSQL & Redis component monitors are temporarily reporting offline mode.
            </p>
          </div>
        </div>
      )}

      {/* THREE LIVE SERVICE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Card: API Server */}
        <div className="card-base p-6 rounded-lg flex flex-col justify-between h-48 hover:border-beige-deep transition-all shadow-sm border border-hairline-soft">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-ink font-bold text-xs font-mono">
              <Server size={14} className="text-accent-blue" />
              API Server
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-mono text-[9px] font-bold uppercase ${
              health && health.status !== 'down'
                ? 'text-accent-green bg-accent-green/5 border-accent-green/20'
                : 'text-accent-red bg-accent-red/5 border-accent-red/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                health && health.status !== 'down' ? 'bg-accent-green animate-pulse' : 'bg-accent-red'
              }`}></span>
              {health && health.status !== 'down' ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>

          <div className="space-y-1 mt-4">
            <span className="text-micro-uppercase text-slate block">Application Host</span>
            <p className="text-heading-5 font-bold text-ink">{health?.api?.details?.host || 'Uvicorn FastAPI Worker'}</p>
            <p className="text-[10px] font-mono text-slate">Version: v{health?.api?.details?.version || '1.0.0'}</p>
          </div>
          
          <div className="border-t border-beige-deep/50 pt-2.5 mt-2 flex justify-between font-mono text-[9px] text-slate">
            <span>Uptime: {health && health.status !== 'down' ? formatUptime(health?.api?.details?.uptime_seconds) : 'Offline'}</span>
            <span>Workers: {health?.api?.details?.workers || 4} active</span>
          </div>
        </div>

        {/* Card: PostgreSQL Database */}
        <div className="card-base p-6 rounded-lg flex flex-col justify-between h-48 hover:border-beige-deep transition-all shadow-sm border border-hairline-soft">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-ink font-bold text-xs font-mono">
              <Database size={14} className="text-purple-500" />
              PostgreSQL
            </div>
            <div className="flex items-center gap-1 px-2.5 py-0.5 bg-cream rounded-full border border-beige-deep font-mono text-[9px] font-bold uppercase">
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                health?.database?.status === 'ok' ? 'bg-accent-green animate-pulse' : 'bg-accent-red'
              }`}></span>
              <span className={health?.database?.status === 'ok' ? 'text-accent-green' : 'text-accent-red'}>
                {health?.database?.status === 'ok' ? 'Connected' : health ? 'Offline' : 'Checking...'}
              </span>
            </div>
          </div>

          <div className="space-y-1 mt-4">
            <span className="text-micro-uppercase text-slate block">Database Engine</span>
            <p className="text-heading-5 font-bold text-ink">{health?.database?.details?.engine || 'Neon Serverless Cluster'}</p>
            <p className="text-[10px] font-mono text-slate">Pool Status: {health?.database?.details?.active_connections || 0} active/{health?.database?.details?.max_connections || 20} max</p>
          </div>

          <div className="border-t border-beige-deep/50 pt-2.5 mt-2 flex justify-between font-mono text-[9px] text-slate">
            <span>Schema: {health?.database?.details?.schema_version || 'v1.2_migrations'}</span>
            <span>Avg Latency: {health?.database?.details?.latency_ms !== undefined ? `${health.database.details.latency_ms}ms` : 'Loading...'}</span>
          </div>
        </div>

        {/* Card: Redis Cache */}
        <div className="card-base p-6 rounded-lg flex flex-col justify-between h-48 hover:border-beige-deep transition-all shadow-sm border border-hairline-soft">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-ink font-bold text-xs font-mono">
              <Cpu size={14} className="text-primary" />
              Redis Cache
            </div>
            <div className="flex items-center gap-1 px-2.5 py-0.5 bg-cream rounded-full border border-beige-deep font-mono text-[9px] font-bold uppercase">
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                health?.redis?.status === 'ok' ? 'bg-accent-green animate-pulse' : 'bg-accent-red'
              }`}></span>
              <span className={health?.redis?.status === 'ok' ? 'text-accent-green' : 'text-accent-red'}>
                {health?.redis?.status === 'ok' ? 'Active' : health ? 'Offline' : 'Checking...'}
              </span>
            </div>
          </div>

          <div className="space-y-1 mt-4">
            <span className="text-micro-uppercase text-slate block">Caching & Rate limits</span>
            <p className="text-heading-5 font-bold text-ink">{health?.redis?.details?.engine || 'Redis Hot Store'}</p>
            <p className="text-[10px] font-mono text-slate">Memory: {health?.redis?.details ? `${formatBytes(health.redis.details.memory_used_bytes)} / ${formatBytes(health.redis.details.memory_limit_bytes)} limit` : 'Loading...'}</p>
          </div>

          <div className="border-t border-beige-deep/50 pt-2.5 mt-2 flex justify-between font-mono text-[9px] text-slate">
            <span>Throttle count: {health?.redis?.details?.throttle_count_per_min || 0}/min</span>
            <span>Keys stored: {health?.redis?.details?.keys_stored !== undefined ? health.redis.details.keys_stored.toLocaleString() : 'Loading...'}</span>
          </div>
        </div>

      </div>

      {/* INTERACTIVE RUNBOOK SIMULATOR BUTTONS */}
      <div className="bg-cream border border-beige-deep p-4 rounded-lg relative z-10 shadow-sm">
        <span className="text-[10px] font-mono font-bold tracking-widest text-slate uppercase block mb-3">Diagnostic Runbook Simulator</span>
        <div className="flex flex-wrap gap-2.5">
          
          <button
            onClick={() => simulateAction('ping_db')}
            className="bg-surface border border-beige-deep text-slate hover:text-ink hover:bg-cream-soft px-3 py-1.5 rounded-md h-[34px] transition-all flex items-center justify-center font-mono text-xs"
          >
            <Play size={10} className="mr-1.5 text-accent-blue" />
            Ping PostgreSQL
          </button>

          <button
            onClick={() => simulateAction('flush_redis')}
            className="bg-surface border border-beige-deep text-slate hover:text-ink hover:bg-cream-soft px-3 py-1.5 rounded-md h-[34px] transition-all flex items-center justify-center font-mono text-xs"
          >
            <Trash2 size={10} className="mr-1.5 text-primary" />
            Flush Redis Cache
          </button>

          <button
            onClick={() => simulateAction('query_test')}
            className="bg-surface border border-beige-deep text-slate hover:text-ink hover:bg-cream-soft px-3 py-1.5 rounded-md h-[34px] transition-all flex items-center justify-center font-mono text-xs"
          >
            <Send size={10} className="mr-1.5 text-accent-green" />
            Simulate Search Routing
          </button>

          <button
            onClick={() => simulateAction('error_event')}
            className="bg-surface border border-beige-deep text-slate hover:text-ink hover:bg-cream-soft px-3 py-1.5 rounded-md h-[34px] transition-all flex items-center justify-center font-mono text-xs"
          >
            <AlertTriangle size={10} className="mr-1.5 text-accent-red" />
            Simulate Provider Timeout
          </button>

          <button
            onClick={() => simulateAction('clear_logs')}
            className="ml-auto bg-surface border border-beige-deep hover:bg-cream-deeper text-[10px] text-slate hover:text-ink px-3 py-1.5 rounded-md h-[34px] transition-all flex items-center justify-center font-mono"
          >
            Clear Console
          </button>

        </div>
      </div>

      {/* OPERATIONAL LOG STREAM TERMINAL */}
      <div className="bg-surface-code border border-white/10 rounded-lg overflow-hidden flex flex-col relative z-10 shadow-lg">
        
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-surface-code/80 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs">
            <Terminal size={13} className="text-accent-blue" />
            <span className="font-bold text-white">logs_watcher_node01.log</span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-red opacity-80"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow opacity-80"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green opacity-80"></span>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="bg-surface-code p-4 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2 text-left border-t border-white/5 text-on-dark-muted">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2 items-start hover:bg-white/5 py-0.5 px-1 rounded transition-colors">
              <span className="text-on-dark-muted shrink-0 select-none">[{log.time}]</span>
              <span className={`shrink-0 font-bold ${
                log.type === 'error' ? 'text-accent-red' :
                log.type === 'warning' ? 'text-accent-orange' :
                log.type === 'success' ? 'text-accent-green' : 'text-accent-blue'
              }`}>
                {log.type === 'error' ? '[ERROR]' :
                 log.type === 'warning' ? '[WARN]' :
                 log.type === 'success' ? '[SUCCESS]' : '[INFO]'}
              </span>
              <span className={
                log.type === 'error' ? 'text-accent-red font-medium' :
                log.type === 'warning' ? 'text-accent-orange font-medium' :
                log.type === 'success' ? 'text-white font-semibold' : 'text-on-dark-muted'
              }>
                {log.text}
              </span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  )
}
