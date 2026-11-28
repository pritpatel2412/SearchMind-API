import React, { useState, useEffect } from 'react'
import { Layers, Globe, Clock, ShieldCheck, Trash2, RefreshCw, AlertCircle, Copy, Check, Terminal, ExternalLink, Activity } from 'lucide-react'

export default function SessionsPage() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
      const res = await fetch(`${apiUrl}/v1/admin/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      setSessions(data)
      setError('')
    } catch (e) {
      console.error(e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleTerminate = async (sessionId) => {
    if (!window.confirm(`Are you sure you want to terminate browser session '${sessionId}'?`)) return
    try {
      const token = localStorage.getItem('adminToken')
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
      const res = await fetch(`${apiUrl}/v1/admin/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`Failed to terminate session (${res.status})`)
      setActionMsg(`Session ${sessionId} terminated successfully`)
      fetchSessions()
      setTimeout(() => setActionMsg(''), 3000)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleCleanExpired = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
      const res = await fetch(`${apiUrl}/v1/admin/sessions/clean`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`Failed to clean sessions (${res.status})`)
      const result = await res.json()
      setActionMsg(`Cleaned ${result.evicted_count} expired session(s)`)
      fetchSessions()
      setTimeout(() => setActionMsg(''), 3000)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(''), 2000)
  }

  const formatSeconds = (sec) => {
    if (sec <= 0) return 'Expired'
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}m ${s}s`
  }

  const totalCookies = sessions.reduce((acc, s) => acc + (s.cookies_count || 0), 0)

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-heading-2 text-ink">Persistent Browser Sessions</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
              Agent State
            </span>
          </div>
          <p className="text-body-sm text-slate mt-1">
            Real-time administrative control over active headless browser instances, cookie vaults, and session lease timers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCleanExpired}
            className="button-ghost text-xs font-mono h-9 px-3 flex items-center gap-1.5 border border-beige-deep hover:bg-cream-deeper text-charcoal hover:text-ink cursor-pointer"
            title="Force evict expired sessions from memory"
          >
            <Clock size={13} className="text-slate" />
            Evict Expired
          </button>
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="button-primary text-xs font-mono h-9 px-4 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-mono rounded-md flex items-center gap-2">
          <Check size={14} />
          {actionMsg}
        </div>
      )}

      {error && (
        <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-mono rounded-md flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-base p-5 border border-beige-deep rounded-lg bg-cream/40">
          <div className="flex items-center justify-between">
            <span className="text-micro-uppercase text-slate">Active Sessions</span>
            <Layers size={14} className="text-primary" />
          </div>
          <p className="text-heading-2 text-ink mt-2 font-mono">{sessions.length}</p>
          <p className="text-[11px] text-slate mt-1 font-mono">Live browser worker contexts</p>
        </div>

        <div className="card-base p-5 border border-beige-deep rounded-lg bg-cream/40">
          <div className="flex items-center justify-between">
            <span className="text-micro-uppercase text-slate">Encrypted Cookies</span>
            <ShieldCheck size={14} className="text-accent-green" />
          </div>
          <p className="text-heading-2 text-ink mt-2 font-mono">{totalCookies}</p>
          <p className="text-[11px] text-slate mt-1 font-mono">Stored in isolated vault memory</p>
        </div>

        <div className="card-base p-5 border border-beige-deep rounded-lg bg-cream/40">
          <div className="flex items-center justify-between">
            <span className="text-micro-uppercase text-slate">Session Reclamation</span>
            <Activity size={14} className="text-accent-blue" />
          </div>
          <p className="text-heading-2 text-ink mt-2 font-mono">Auto</p>
          <p className="text-[11px] text-slate mt-1 font-mono">Lease expiration & garbage collected</p>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="card-base border border-beige-deep rounded-lg overflow-hidden bg-cream/30">
        <div className="p-4 border-b border-beige-deep flex items-center justify-between bg-cream/60">
          <span className="text-micro-uppercase text-ink font-bold">Active Sessions Registry</span>
          <span className="text-micro text-slate font-mono">{sessions.length} registered</span>
        </div>

        {sessions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers size={32} className="text-slate/40 mx-auto" />
            <h3 className="text-body-md text-ink font-semibold">No Active Browser Sessions</h3>
            <p className="text-body-sm text-slate max-w-md mx-auto">
              When client agents invoke <code className="font-mono text-primary text-xs">/v1/sessions</code> to maintain stateful navigation or cookie persistence, active sessions will render here for real-time monitoring and termination.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-beige-deep text-xs font-mono">
              <thead className="bg-cream text-charcoal border-b border-beige-deep">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Session ID</th>
                  <th className="px-4 py-3 text-left font-bold">Current / Target URL</th>
                  <th className="px-4 py-3 text-left font-bold">Cookies</th>
                  <th className="px-4 py-3 text-left font-bold">History</th>
                  <th className="px-4 py-3 text-left font-bold">TTL Remaining</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-deep/50 bg-cream-soft text-ink">
                {sessions.map((s) => (
                  <tr key={s.session_id} className="hover:bg-cream-deeper/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-primary">
                      <div className="flex items-center gap-1.5">
                        <span>{s.session_id}</span>
                        <button
                          onClick={() => handleCopy(s.session_id)}
                          className="text-slate hover:text-ink transition-colors"
                          title="Copy Session ID"
                        >
                          {copiedId === s.session_id ? <Check size={11} className="text-accent-green" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate font-sans max-w-xs truncate" title={s.current_url || 'None'}>
                      {s.current_url ? (
                        <a href={s.current_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-ink hover:text-primary transition-colors">
                          <span className="truncate">{s.current_url}</span>
                          <ExternalLink size={10} className="shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate/60 italic font-mono text-[11px]">No URL initialized</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      <span className="px-2 py-0.5 rounded bg-cream border border-beige-deep text-[11px]">
                        {s.cookies_count} in vault
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {s.history_count} steps
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      <span className={s.ttl_seconds_remaining < 300 ? 'text-accent-red animate-pulse' : 'text-accent-green'}>
                        {formatSeconds(s.ttl_seconds_remaining)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleTerminate(s.session_id)}
                        className="px-2.5 py-1 text-[11px] font-mono rounded bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red hover:text-white transition-all cursor-pointer flex items-center gap-1 ml-auto"
                        title="Force terminate this session"
                      >
                        <Trash2 size={11} />
                        Terminate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
