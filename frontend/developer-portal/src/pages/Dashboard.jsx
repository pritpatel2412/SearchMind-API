import React, { useState, useEffect } from 'react'
import ApiKeyCard from '../components/ApiKeyCard.jsx'
import UsageChart from '../components/UsageChart.jsx'
import { 
  Key, Plus, RefreshCw, BarChart3, AlertCircle, X, Terminal, 
  HelpCircle, Code, Cpu, Activity, Play, Check, Copy, ShieldCheck, Zap 
} from 'lucide-react'

const formatTime = (isoStr) => {
  if (!isoStr) return ''
  try {
    const date = new Date(isoStr)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 5) return 'just now'
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}h ago`
    return date.toLocaleDateString()
  } catch (e) {
    return ''
  }
}

export default function Dashboard({ token, user, apiKey, setApiKey }) {
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
  const [keys, setKeys] = useState([])
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [keysLoading, setKeysLoading] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')
  const [successKey, setSuccessKey] = useState(null)
  
  // Interactive Console/QuickStart States
  const [activeLang, setActiveLang] = useState('curl')
  const [copiedCode, setCopiedCode] = useState(false)

  // Live Telemetry States
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)

  const fetchLogsData = async () => {
    if (!token) return
    setLogsLoading(true)
    try {
      const response = await fetch(`${apiUrl}/v1/logs?limit=4`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to load activity logs')
      const data = await response.json()
      setLogs(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => {
      fetchLogsData()
    }, 10000)
    return () => clearInterval(interval)
  }, [token])

  const fetchUsageData = async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/v1/usage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to load usage data')
      const data = await response.json()
      setUsage(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchKeysData = async () => {
    if (!token) return
    setKeysLoading(true)
    try {
      const response = await fetch(`${apiUrl}/v1/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to load API keys')
      const data = await response.json()
      setKeys(data)
      // Save active key if empty
      if (data.length > 0 && !apiKey) {
        setApiKey(data[0].full_key || '')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setKeysLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchUsageData()
      fetchKeysData()
      fetchLogsData()
    }
  }, [token])

  const handleCreateKey = async (e) => {
    e.preventDefault()
    setError('')
    if (!newKeyName.trim()) return

    try {
      const response = await fetch(`${apiUrl}/v1/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newKeyName })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Failed to create API key')

      setSuccessKey(data.full_key)
      setKeys(prev => [data, ...prev])
      setNewKeyName('')
      if (data.full_key) {
        setApiKey(data.full_key)
      }
      fetchUsageData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRevokeKey = async (keyId) => {
    try {
      const response = await fetch(`${apiUrl}/v1/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to revoke API key')
      
      setKeys(prev => prev.filter(k => k.id !== keyId))
      fetchUsageData()
    } catch (err) {
      alert(err.message)
    }
  }

  const triggerRefresh = () => {
    fetchUsageData()
    fetchKeysData()
    fetchLogsData()
  }

  // Active Key display selection
  const activeKeyDisplay = apiKey || (keys.length > 0 ? `${keys[0].key_prefix}••••••••••••••••••••••••••••` : 'sm_live_your_api_key_here')

  const codeSnippets = {
    curl: `curl -X POST "${apiUrl}/v1/search" \\
  -H "X-API-Key: ${activeKeyDisplay}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "FastAPI advantages",
    "search_depth": "basic"
  }'`,
    python: `from searchmind import SearchMindClient

client = SearchMindClient(api_key="${activeKeyDisplay}")
results = client.search(
    query="FastAPI advantages",
    search_depth="basic"
)
print(results)`,
    node: `import { SearchMindClient } from 'searchmind';

const client = new SearchMindClient({
  apiKey: '${activeKeyDisplay}'
});

const results = await client.search({
  query: 'FastAPI advantages',
  searchDepth: 'basic'
});
console.log(results);`
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeLang])
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 space-y-10 text-left relative overflow-hidden">
      
      {/* Background ambient lighting glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-blue/3 blur-[120px] pointer-events-none z-0"></div>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline pb-6 z-10 relative">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-heading-1 text-ink font-light">Developer Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono tracking-wider uppercase font-semibold">
              {user?.plan || 'Free'} Plan
            </span>
          </div>
          <p className="text-caption text-slate">Manage credentials, track monthly query quotas, and explore telemetry logs.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={triggerRefresh}
            disabled={loading || keysLoading}
            className="button-cream text-xs font-mono flex items-center h-[38px] cursor-pointer"
          >
            <RefreshCw size={12} className={`mr-1.5 ${loading || keysLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => { setShowCreateModal(true); setSuccessKey(null); setError(''); }}
            className="button-primary text-xs flex items-center h-[38px] font-bold cursor-pointer"
          >
            <Plus size={13} className="mr-1" />
            Create API Key
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Analytics & Keys, Right = Code & Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative">
        
        {/* LEFT COLUMN: Quotas, Endpoint Breakdown, Keys */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Quota overview panel */}
          {usage && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Remaining Quota */}
              <div className="bg-cream-soft/40 backdrop-blur-md border border-hairline p-5 rounded-xl flex items-center justify-between group hover:border-primary/25 hover:shadow-[0_0_15px_rgba(241,90,36,0.06)] transition-all duration-300">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate uppercase tracking-wider">Remaining Quota</span>
                  <p className="text-stat-display text-ink mt-0.5">{usage.remaining_requests.toLocaleString()}</p>
                  <span className="text-[10.5px] text-slate font-mono block">of {usage.monthly_limit.toLocaleString()} free credits</span>
                </div>
                <div className="p-3 rounded-lg bg-cream border border-beige-deep text-primary transition-colors group-hover:bg-primary/5">
                  <Key size={16} />
                </div>
              </div>

              {/* Requests Usage */}
              <div className="bg-cream-soft/40 backdrop-blur-md border border-hairline p-5 rounded-xl flex items-center justify-between group hover:border-[#3b9eff]/25 hover:shadow-[0_0_15px_rgba(59,158,255,0.06)] transition-all duration-300">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate uppercase tracking-wider">Requests Usage</span>
                  <p className="text-stat-display text-ink mt-0.5">{usage.total_requests.toLocaleString()}</p>
                  <span className="text-[10.5px] text-slate font-mono block">Period: {usage.period}</span>
                </div>
                <div className="p-3 rounded-lg bg-cream border border-beige-deep text-[#3b9eff] transition-colors group-hover:bg-[#3b9eff]/5">
                  <BarChart3 size={16} />
                </div>
              </div>

              {/* Active Keys */}
              <div className="bg-cream-soft/40 backdrop-blur-md border border-hairline p-5 rounded-xl flex items-center justify-between group hover:border-[#10b981]/25 hover:shadow-[0_0_15px_rgba(16,185,129,0.06)] transition-all duration-300">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate uppercase tracking-wider">Active Keys</span>
                  <p className="text-stat-display text-ink mt-0.5">{keys.length}</p>
                  <span className="text-[10.5px] text-slate font-mono block">Credentials fully active</span>
                </div>
                <div className="p-3 rounded-lg bg-cream border border-beige-deep text-[#10b981] transition-colors group-hover:bg-[#10b981]/5">
                  <Zap size={16} />
                </div>
              </div>

            </div>
          )}

          {/* Endpoint breakdown */}
          <UsageChart usage={usage} />

          {/* API Keys list */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="text-slate" size={16} />
              <h2 className="text-heading-3 text-ink">API Credentials</h2>
            </div>
            
            <div className="space-y-4">
              {keysLoading ? (
                <div className="text-center py-12 text-xs font-mono text-slate bg-cream-soft/20 border border-hairline rounded-lg">
                  Loading API credentials...
                </div>
              ) : keys.length === 0 ? (
                <div className="text-center py-12 text-xs font-mono text-slate bg-cream-soft/20 border border-hairline rounded-lg">
                  No API credentials configured. Click "Create API Key" to provision.
                </div>
              ) : (
                keys.map(key => (
                  <ApiKeyCard 
                    key={key.id} 
                    apiKey={key} 
                    usageStats={usage} 
                    onRevoke={handleRevokeKey} 
                  />
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Code Sandbox & Telemetry logs */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Quick Start Code Panel */}
          <div className="bg-cream-soft/40 backdrop-blur-md border border-hairline rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-hairline bg-cream flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Code size={14} className="text-primary" />
                <span className="font-semibold text-xs text-ink uppercase tracking-wider font-sans">Quick Start SDK</span>
              </div>
              
              {/* Language Selector Tabs */}
              <div className="flex bg-canvas p-0.5 rounded-md border border-hairline text-[10px] font-mono">
                {['curl', 'python', 'node'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`px-2 py-1 rounded transition-all cursor-pointer ${
                      activeLang === lang ? 'bg-cream text-primary font-bold' : 'text-slate hover:text-ink'
                    }`}
                  >
                    {lang === 'node' ? 'NodeJS' : lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Code editor body */}
            <div className="p-4 bg-surface-code text-left relative group">
              <button
                onClick={handleCopyCode}
                className="absolute right-3 top-3 p-1.5 rounded bg-cream border border-beige-deep text-slate hover:text-primary transition-colors cursor-pointer"
                title="Copy Code"
              >
                {copiedCode ? <Check size={12} className="text-accent-green" /> : <Copy size={12} />}
              </button>
              
              <pre className="text-[11px] font-mono text-ink/90 overflow-x-auto select-all pr-8 whitespace-pre-wrap leading-relaxed">
                <code>{codeSnippets[activeLang]}</code>
              </pre>
            </div>
            
            <div className="px-4 py-3 bg-cream/60 border-t border-hairline text-[10px] text-slate leading-relaxed font-sans">
              Need dependencies? Install via <code className="bg-canvas border border-hairline px-1 py-0.5 rounded text-[9.5px] font-mono text-primary">pip install searchmind-api</code> or <code className="bg-canvas border border-hairline px-1 py-0.5 rounded text-[9.5px] font-mono text-primary">npm install searchmind</code>.
            </div>
          </div>

          {/* Live Request Telemetry Logs feed */}
          <div className="bg-cream-soft/40 backdrop-blur-md border border-hairline rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-hairline bg-cream flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-accent-green animate-pulse" />
                <span className="font-semibold text-xs text-ink uppercase tracking-wider font-sans">Live Activity Stream</span>
              </div>
              <span className="text-[9px] font-mono text-accent-green bg-accent-green/5 border border-accent-green/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Listening
              </span>
            </div>

            {/* Log feed body */}
            <div className="p-4 bg-surface-code divide-y divide-hairline min-h-[220px] flex flex-col justify-start">
              {logsLoading && logs.length === 0 ? (
                <div className="text-center py-8 text-[11px] font-mono text-slate">Loading logs...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-[11px] font-mono text-slate">No recent API requests. Make a request using your key!</div>
              ) : (
                logs.map((log) => {
                  const fullEndpoint = log.endpoint.startsWith('/') ? log.endpoint : `/v1/${log.endpoint}`
                  const isSuccess = log.status_code === 200
                  return (
                    <div key={log.id} className="py-3 first:pt-0 last:pb-0 text-left flex flex-col gap-1">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-bold">POST</span>
                          <span className="text-ink font-semibold">{fullEndpoint}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                          isSuccess
                            ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' 
                            : 'bg-accent-red/10 text-accent-red border border-accent-red/20'
                        }`}>
                          {log.status_code} {isSuccess ? 'OK' : 'BLOCKED'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10.5px] font-mono text-slate">
                        <span className="truncate max-w-[170px] italic">
                          {log.query ? `q: "${log.query}"` : 'no query'}
                        </span>
                        <div className="flex gap-2.5 items-center shrink-0">
                          <span>{log.latency_ms ? `${log.latency_ms}ms` : '0ms'}</span>
                          <span className="text-hairline-strong">•</span>
                          <span>{formatTime(log.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="px-4 py-3.5 bg-cream/60 border-t border-hairline flex items-center justify-between text-[10px] text-slate font-sans">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-ping"></span>
                Live Activity Feed
              </span>
              <span>Showing last 4 transactions</span>
            </div>
          </div>

        </div>

      </div>

      {/* Create Key Modal (Translucent overlay) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/85 backdrop-blur-md">
          <div className="bg-cream-soft border border-hairline max-w-md w-full p-8 rounded-xl space-y-6 relative shadow-2xl">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <Key className="text-primary" size={16} />
                <h3 className="text-heading-4 text-ink font-semibold">Generate API Key</h3>
              </div>
              <button 
                onClick={() => { setShowCreateModal(false); setSuccessKey(null); }}
                className="text-slate hover:text-primary transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            {error && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs rounded font-mono text-center">
                {error}
              </div>
            )}

            {successKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-2.5">
                  <AlertCircle className="text-primary shrink-0 mt-0.5" size={15} />
                  <p className="text-xs text-slate font-sans leading-relaxed">
                    Copy and save this key secret immediately. For security, this secret **cannot be displayed again** once closed.
                  </p>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate uppercase tracking-wider">API Key Secret</label>
                  <div className="flex items-center gap-2 bg-surface-code px-3.5 py-3 rounded-lg border border-hairline">
                    <code className="text-xs font-mono text-primary break-all select-all flex-grow font-semibold">{successKey}</code>
                  </div>
                </div>

                <button
                  onClick={() => { setShowCreateModal(false); setSuccessKey(null); }}
                  className="button-dark w-full font-bold cursor-pointer"
                >
                  I Have Copied the Key
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-5">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-mono text-slate uppercase tracking-wider">Key Label / Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production client server"
                    className="glass-input border border-hairline focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="button-cream text-xs h-[36px] px-4 py-1 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button-dark text-xs h-[36px] px-5 py-1 font-bold cursor-pointer"
                  >
                    Generate Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
