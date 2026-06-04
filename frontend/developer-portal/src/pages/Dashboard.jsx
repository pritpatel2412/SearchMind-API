import React, { useState, useEffect } from 'react'
import ApiKeyCard from '../components/ApiKeyCard.jsx'
import UsageChart from '../components/UsageChart.jsx'
import { Key, Plus, RefreshCw, BarChart3, AlertCircle } from 'lucide-react'

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

      // Save full key to show once to user
      setSuccessKey(data.full_key)
      
      // Update key list
      setKeys(prev => [data, ...prev])
      setNewKeyName('')
      
      // Set as active API key for Playground
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
      
      // If the user revoked the active key they are logged in with, alert them
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Developer Dashboard</h1>
          <p className="text-sm text-gray-400">Manage your credentials, limits, and view live endpoints statistics.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={triggerRefresh}
            disabled={loading || keysLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs bg-gray-800 hover:bg-gray-700 disabled:text-gray-600 transition-all border border-brand-border rounded-lg text-gray-300 font-semibold"
          >
            <RefreshCw size={12} className={loading || keysLoading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
          <button
            onClick={() => { setShowCreateModal(true); setSuccessKey(null); setError(''); }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 transition-all rounded-lg text-white font-bold shadow-glow"
          >
            <Plus size={14} />
            Create API Key
          </button>
        </div>
      </div>

      {/* Quota overview panel */}
      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-xl text-left border border-brand-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining Quota</span>
              <p className="text-3xl font-extrabold text-white">{usage.remaining_requests.toLocaleString()}</p>
              <span className="text-xs text-gray-400">out of {usage.monthly_limit.toLocaleString()} monthly</span>
            </div>
            <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
              <Key size={24} />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl text-left border border-brand-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Requests this period</span>
              <p className="text-3xl font-extrabold text-white">{usage.total_requests.toLocaleString()}</p>
              <span className="text-xs text-gray-400">Billing cycle: {usage.period}</span>
            </div>
            <div className="p-3 rounded-full bg-purple-500/10 text-purple-400">
              <BarChart3 size={24} />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl text-left border border-brand-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Credentials</span>
              <p className="text-3xl font-extrabold text-white">{keys.length}</p>
              <span className="text-xs text-gray-400">SHA-256 encrypted storage</span>
            </div>
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
              <Plus size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Usage breakdown charts */}
      <UsageChart usage={usage} />

      {/* API Key management */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white text-left">API Credentials</h2>
        <div className="space-y-4 text-left">
          {keysLoading ? (
            <div className="text-center py-12 text-sm text-gray-500">Loading API keys...</div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-xl text-sm text-gray-500">
              No API keys configured. Click "Create API Key" to provision one.
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

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-brand-border space-y-6 text-left relative">
            <h3 className="text-xl font-bold text-white">Generate API Credential</h3>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center font-semibold">
                {error}
              </div>
            )}

            {successKey ? (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-lg flex items-start gap-2.5">
                  <AlertCircle className="text-indigo-400 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-gray-400">
                    Copy and save this key immediately. For safety, this credentials secret **cannot be displayed again** after closing this dialog.
                  </p>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">API Key Secret</label>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg border border-brand-border/60">
                    <code className="text-sm font-mono text-indigo-300 break-all select-all flex-grow">{successKey}</code>
                  </div>
                </div>

                <button
                  onClick={() => { setShowCreateModal(false); setSuccessKey(null); }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-bold rounded-lg text-sm text-center shadow-glow"
                >
                  I Have Copied the Key
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Label / Name</label>
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
                    className="px-4 py-2 border border-brand-border hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-glow"
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
