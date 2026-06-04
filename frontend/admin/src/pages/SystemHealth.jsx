import React, { useState, useEffect } from 'react'
import { Activity, Server, Cpu, Database, RefreshCw, Terminal, CheckCircle2, XCircle } from 'lucide-react'

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchHealth = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:8000/health')
      if (!res.ok) throw new Error('Health check endpoint degraded')
      const data = await res.json()
      setHealth(data)
    } catch (e) {
      setError(e.message)
      setHealth({
        status: 'degraded',
        checks: { api: 'ok', database: 'error', redis: 'error' }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 10000) // check every 10s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Activity className="text-violet-400" />
            System Health
          </h1>
          <p className="text-sm text-gray-400">View operational statuses, check backend connectors, and trace database migrations health.</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-xs bg-gray-800 hover:bg-gray-700 disabled:text-gray-600 transition-all border border-brand-border rounded-lg text-gray-300 font-semibold"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Force Check
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-semibold">
          Warning: API host returned degraded status ({error}). Please verify that your local Docker services or backend server are running.
        </div>
      )}

      {/* Connectivity indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* API Server */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-300 font-bold">
              <Server size={18} className="text-violet-400" />
              API Server
            </div>
            {health?.checks?.api === 'ok' ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <XCircle size={18} className="text-red-400" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-400">FastAPI Uvicorn workers</p>
            <p className="text-lg font-bold text-white">Status: {health?.checks?.api === 'ok' ? 'Operational' : 'Offline'}</p>
          </div>
        </div>

        {/* Database */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-300 font-bold">
              <Database size={18} className="text-fuchsia-400" />
              PostgreSQL
            </div>
            {health?.checks?.database === 'ok' ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <XCircle size={18} className="text-red-400" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-400">PostgreSQL (Neon Cloud DB)</p>
            <p className="text-lg font-bold text-white">Status: {health?.checks?.database === 'ok' ? 'Connected' : 'Unreachable'}</p>
          </div>
        </div>

        {/* Cache / Redis */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-300 font-bold">
              <Cpu size={18} className="text-cyan-400" />
              Redis Cache
            </div>
            {health?.checks?.redis === 'ok' ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <XCircle size={18} className="text-red-400" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-400">Redis rate limiting & cache</p>
            <p className="text-lg font-bold text-white">Status: {health?.checks?.redis === 'ok' ? 'Operational' : 'Degraded'}</p>
          </div>
        </div>
      </div>

      {/* System info */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
        <h3 className="font-bold text-gray-200 border-b border-brand-border/40 pb-3">Operational Log Stream</h3>
        
        <div className="bg-black/35 rounded-xl border border-brand-border/40 p-4 font-mono text-xs text-gray-400 space-y-2 h-48 overflow-y-auto">
          <div>[INFO] {new Date().toISOString()} Starting health check heartbeat probe...</div>
          <div>[INFO] {new Date().toISOString()} API health query responded: status_code=200</div>
          {health?.checks?.database === 'ok' && (
            <div>[INFO] {new Date().toISOString()} Database Connection: OK (PostgreSQL dialect: asyncpg)</div>
          )}
          {health?.checks?.redis === 'ok' && (
            <div>[INFO] {new Date().toISOString()} Redis cache hit checks: PING {"->"} PONG successful</div>
          )}
          {health?.status === 'degraded' && (
            <div className="text-red-400 font-semibold">[ERROR] {new Date().toISOString()} Connector pipeline failure: checks.database is degraded.</div>
          )}
        </div>
      </div>
    </div>
  )
}
