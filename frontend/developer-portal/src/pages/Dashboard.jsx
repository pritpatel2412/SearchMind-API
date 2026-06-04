import React, { useState, useEffect } from 'react'
import ApiKeyCard from '../components/ApiKeyCard.jsx'
import UsageChart from '../components/UsageChart.jsx'
import { Key, Plus, RefreshCw, BarChart3, AlertCircle, X, Terminal, HelpCircle } from 'lucide-react'

export default function Dashboard({ token, user, apiKey, setApiKey }) {
  const [keys, setKeys] = useState([])
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [keysLoading, setKeysLoading] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')
  const [successKey, setSuccessKey] = useState(null)

  const fetchUsageData = async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/v1/usage', {
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
      const response = await fetch('http://localhost:8000/v1/api-keys', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to load API keys')
      const data = await response.json()
      setKeys(data)
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
    }
  }, [token])

  const handleCreateKey = async (e) => {
    e.preventDefault()
    setError('')
    if (!newKeyName.trim()) return

    try {
      const response = await fetch('http://localhost:8000/v1/api-keys', {
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
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRevokeKey = async (keyId) => {
    try {
      const response = await fetch(`http://localhost:8000/v1/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to revoke API key')
      
      if (keyId === apiKey) {
        alert('You revoked your active credentials key! Please log back in to generate a new key.')
        window.location.reload()
      } else {
        setKeys(prev => prev.filter(k => k.id !== keyId))
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const triggerRefresh = () => {
    fetchUsageData()
    fetchKeysData()
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 space-y-12 text-left">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-medium text-ink">Developer Dashboard</h1>
          <p className="text-xs font-mono text-mute mt-1">Manage search API credentials, monthly limits, and trace query analytics.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={triggerRefresh}
            disabled={loading || keysLoading}
            className="button-ghost text-xs font-mono"
          >
            <RefreshCw size={12} className={`mr-1.5 ${loading || keysLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => { setShowCreateModal(true); setSuccessKey(null); setError(''); }}
            className="button-primary text-xs"
          >
            <Plus size={13} className="mr-1" />
            Create API Key
          </button>
        </div>
      </div>

      {/* Quota overview panel */}
      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-surface-card border border-hairline-strong p-6 rounded-lg flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-mute uppercase">Remaining Quota</span>
              <p className="text-3xl font-extrabold font-mono text-ink mt-1">{usage.remaining_requests.toLocaleString()}</p>
              <span className="text-[11px] text-mute font-mono">of {usage.monthly_limit.toLocaleString()} monthly</span>
            </div>
            <div className="p-3 rounded bg-surface-deep border border-hairline text-accent-blue">
              <Key size={16} />
            </div>
          </div>

          <div className="bg-surface-card border border-hairline-strong p-6 rounded-lg flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-mute uppercase">Requests usage</span>
              <p className="text-3xl font-extrabold font-mono text-ink mt-1">{usage.total_requests.toLocaleString()}</p>
              <span className="text-[11px] text-mute font-mono">Period: {usage.period}</span>
            </div>
            <div className="p-3 rounded bg-surface-deep border border-hairline text-accent-orange">
              <BarChart3 size={16} />
            </div>
          </div>

          <div className="bg-surface-card border border-hairline-strong p-6 rounded-lg flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-mute uppercase">Active Keys</span>
              <p className="text-3xl font-extrabold font-mono text-ink mt-1">{keys.length}</p>
              <span className="text-[11px] text-mute font-mono">Secure SHA-256 tokens</span>
            </div>
            <div className="p-3 rounded bg-surface-deep border border-hairline text-accent-green">
              <Plus size={16} />
            </div>
          </div>

        </div>
      )}

      {/* Usage breakdown charts */}
      <UsageChart usage={usage} />

      {/* API Key management */}
      <div className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-ink">API Credentials</h2>
        <div className="space-y-4">
          {keysLoading ? (
            <div className="text-center py-12 text-xs font-mono text-mute">Loading credentials...</div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12 bg-surface-card border border-hairline-strong rounded-lg text-xs font-mono text-mute">
              No API keys configured. Click "Create API Key" to provision credentials.
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

      {/* Create Key Modal (Translucent overlay) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/85 backdrop-blur-md">
          <div className="bg-surface-card border border-hairline-strong p-6 rounded-lg max-w-md w-full space-y-6 relative shadow-2xl">
            
            <div className="flex justify-between items-center pb-2 border-b border-hairline">
              <h3 className="font-display font-semibold text-ink">Generate API Key</h3>
              <button 
                onClick={() => { setShowCreateModal(false); setSuccessKey(null); }}
                className="text-mute hover:text-ink transition-colors"
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
                <div className="p-3.5 bg-surface-deep border border-hairline-strong rounded-lg flex items-start gap-2.5">
                  <AlertCircle className="text-accent-orange shrink-0 mt-0.5" size={14} />
                  <p className="text-xs text-mute font-sans leading-relaxed">
                    Copy and save this key secret immediately. For security, this secret **cannot be displayed again** once closed.
                  </p>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-mute font-bold uppercase">API Key Secret</label>
                  <div className="flex items-center gap-2 bg-surface-deep px-3 py-2.5 rounded-md border border-hairline-strong">
                    <code className="text-xs font-mono text-accent-orange break-all select-all flex-grow">{successKey}</code>
                  </div>
                </div>

                <button
                  onClick={() => { setShowCreateModal(false); setSuccessKey(null); }}
                  className="button-primary w-full"
                >
                  I Have Copied the Key
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-mute font-bold uppercase">Key label / Description</label>
                  <input
                    type="text"
                    required
                    placeholder="Production application server"
                    className="glass-input"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="button-ghost text-xs px-3 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button-primary text-xs px-4 py-1"
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
