import React, { useState, useEffect } from 'react'
import { Users, Search, Edit3, Shield, Power, Check, X, ShieldAlert, Key, UserCheck, AlertTriangle, Filter, Loader, Activity, Globe, Cpu, Monitor, MapPin, Calendar, Clock, Copy } from 'lucide-react'

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newPlan, setNewPlan] = useState('')
  const [customLimit, setCustomLimit] = useState(50000)

  // Telemetry modal state
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false)
  const [telemetryUser, setTelemetryUser] = useState(null)
  const [copiedUa, setCopiedUa] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const res = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/v1/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data)
      setError('')
    } catch (e) {
      console.error(e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Toggle active/inactive status
  const handleToggleActive = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/v1/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      
      setUsers(prev => prev.map(u => {
        if (u.id === id) {
          return { ...u, active: !currentStatus }
        }
        return u
      }))
    } catch (e) {
      alert(e.message)
    }
  }

  // Open modal for plan editing
  const openEditModal = (user) => {
    setSelectedUser(user)
    setNewPlan(user.plan)
    setCustomLimit(user.plan === 'enterprise' ? 10000000 : user.plan === 'pro' ? 100000 : user.plan === 'starter' ? 10000 : 500)
    setIsEditModalOpen(true)
  }

  // Open modal for telemetry dashboard
  const openTelemetryModal = (user) => {
    setTelemetryUser(user)
    setCopiedUa(false)
    setIsTelemetryModalOpen(true)
  }

  const handleCopyUa = (uaText) => {
    navigator.clipboard.writeText(uaText)
    setCopiedUa(true)
    setTimeout(() => setCopiedUa(false), 2000)
  }

  // Save modified plan
  const handleSavePlan = async () => {
    if (!selectedUser) return
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/v1/admin/users/${selectedUser.id}/plan`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: newPlan })
      })
      if (!res.ok) throw new Error('Failed to update plan')
      
      setUsers(prev => prev.map(u => {
        if (u.id === selectedUser.id) {
          return { ...u, plan: newPlan }
        }
        return u
      }))
      setIsEditModalOpen(false)
      setSelectedUser(null)
    } catch (e) {
      alert(e.message)
    }
  }

  // Filter computations
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = planFilter === 'all' || u.plan === planFilter
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && u.active) || 
                          (statusFilter === 'inactive' && !u.active)
    return matchesSearch && matchesPlan && matchesStatus
  })

  // Quick stats
  const totalUsers = users.length
  const activeCount = users.filter(u => u.active).length
  const premiumCount = users.filter(u => u.plan === 'pro' || u.plan === 'enterprise').length
  const totalRequestsUsed = users.reduce((acc, u) => acc + u.usage, 0)

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto relative glow-orange">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-heading-1 text-ink flex items-center gap-2">
            User Accounts
          </h1>
          <p className="text-caption text-slate mt-1">
            Configure system-wide user subscriptions, keys volume, and operational limits.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-accent-red/5 border border-accent-red/20 rounded-lg flex items-start gap-3 text-accent-red font-sans text-xs z-10 relative">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block uppercase tracking-wider text-micro-uppercase">Database Connection Degraded</span>
            <p className="text-ink/80 leading-relaxed">
              Failed to query telemetry logs: <span className="font-mono text-accent-red bg-accent-red/10 px-1 rounded">{error}</span>. Please verify that the SearchMind API server is running on port 8000.
            </p>
          </div>
        </div>
      )}

      {/* STATS METRIC ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        
        <div className="card-base p-5 flex flex-col justify-between h-32 hover:border-beige-deep transition-all shadow-sm">
          <span className="text-micro-uppercase text-slate">Total Accounts</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-stat-display text-ink">{totalUsers}</span>
            <span className="text-caption text-slate">registered tenants</span>
          </div>
        </div>

        <div className="card-base p-5 flex flex-col justify-between h-32 hover:border-beige-deep transition-all shadow-sm">
          <span className="text-micro-uppercase text-slate">Active API Keys</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-stat-display text-ink">{users.reduce((acc, u) => acc + (u.keys_count || 0), 0)}</span>
            <span className="text-caption text-slate">credentials active</span>
          </div>
        </div>

        <div className="card-base p-5 flex flex-col justify-between h-32 hover:border-beige-deep transition-all shadow-sm">
          <span className="text-micro-uppercase text-slate">Premium Clients</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-stat-display text-ink">{premiumCount}</span>
            <span className="text-caption text-slate">pro & enterprise tiers</span>
          </div>
        </div>

        <div className="card-base p-5 flex flex-col justify-between h-32 hover:border-beige-deep transition-all shadow-sm">
          <span className="text-micro-uppercase text-slate">Cumulative Vol</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-stat-display text-ink">{totalRequestsUsed.toLocaleString()}</span>
            <span className="text-caption text-slate">requests processed</span>
          </div>
        </div>

      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-cream border border-beige-deep p-4 rounded-lg flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between relative z-10 shadow-sm">
        
        {/* Search */}
        <div className="flex-1 flex gap-2.5 items-center bg-surface px-3 py-2 rounded-md border border-beige-deep focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all max-w-md">
          <Search size={12} className="text-slate" />
          <input
            type="text"
            placeholder="Filter accounts by email, user name..."
            className="bg-transparent outline-none text-xs text-ink w-full font-sans placeholder:text-slate"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate hover:text-ink">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate font-sans">
            <Filter size={11} className="text-slate" />
            <span className="font-medium">Filter:</span>
          </div>

          <div className="relative">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-surface text-xs text-ink pl-3 pr-8 py-2 rounded-md border border-beige-deep font-sans font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer hover:bg-cream-soft transition-colors appearance-none h-[38px]"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface text-xs text-ink pl-3 pr-8 py-2 rounded-md border border-beige-deep font-sans font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer hover:bg-cream-soft transition-colors appearance-none h-[38px]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* USERS TABLE PANEL */}
      <div className="bg-surface rounded-lg border border-beige-deep overflow-hidden relative z-10 shadow-sm">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-4 font-mono">
            <Loader className="animate-spin text-primary" size={24} />
            <p className="text-[11px] text-slate">Loading active subscriptions and key statistics...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-beige-deep text-xs font-sans">
              <thead className="bg-cream text-slate font-mono uppercase text-[10px] tracking-wider border-b border-beige-deep">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">User details</th>
                  <th className="px-6 py-4 text-left font-semibold">Joined at</th>
                  <th className="px-6 py-4 text-left font-semibold">API Keys</th>
                  <th className="px-6 py-4 text-left font-semibold">Plan tier</th>
                  <th className="px-6 py-4 text-left font-semibold">Monthly Usage</th>
                  <th className="px-6 py-4 text-left font-semibold">Liveness</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-deep/50 text-ink bg-cream-soft/20">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-cream/40 transition-colors">
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col cursor-pointer group" onClick={() => openTelemetryModal(u)}>
                        <span className="font-bold text-ink text-sm group-hover:text-primary transition-colors">{u.name}</span>
                        <span className="font-mono text-slate mt-0.5 text-xs group-hover:text-ink/80 transition-colors">{u.email}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate font-mono">{u.created_at}</td>

                    <td className="px-6 py-4 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-cream border border-beige-deep text-ink">
                        {u.keys_count} keys
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${
                        u.plan === 'enterprise' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                        u.plan === 'pro' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' :
                        u.plan === 'starter' ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' :
                        'bg-cream text-slate border-beige-deep'
                      }`}>
                        {u.plan}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 w-32">
                        <div className="flex justify-between font-mono text-[9px] text-slate">
                          <span>{u.usage.toLocaleString()} reqs</span>
                        </div>
                        <div className="h-1 bg-cream rounded overflow-hidden border border-beige-deep/40">
                          <div 
                            className={`h-full rounded transition-all duration-500 ${
                              u.plan === 'enterprise' ? 'bg-purple-500' :
                              u.plan === 'pro' ? 'bg-accent-green' :
                              u.plan === 'starter' ? 'bg-accent-blue' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(100, (u.usage / (u.plan === 'enterprise' ? 10000000 : u.plan === 'pro' ? 100000 : u.plan === 'starter' ? 10000 : 500)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                        u.active ? 'text-accent-green bg-accent-green/5' : 'text-accent-red bg-accent-red/5'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          u.active ? 'bg-accent-green animate-pulse' : 'bg-accent-red'
                        }`}></span>
                        {u.active ? 'ACTIVE' : 'MUTED'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => openTelemetryModal(u)}
                          className="p-1.5 rounded bg-surface border border-beige-deep text-slate hover:text-accent-blue hover:border-accent-blue/30 transition-all cursor-pointer"
                          title="View telemetry & analytics"
                        >
                          <Activity size={11} />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded bg-surface border border-beige-deep text-slate hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                          title="Modify Quotas"
                        >
                          <Edit3 size={11} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u.id, u.active)}
                          className={`p-1.5 rounded bg-surface border transition-all cursor-pointer ${
                            u.active 
                              ? 'border-beige-deep text-slate hover:text-accent-red hover:border-accent-red/30' 
                              : 'border-accent-red/20 text-accent-red hover:text-accent-green hover:border-accent-green/30'
                          }`}
                          title={u.active ? 'Revoke Access' : 'Activate Access'}
                        >
                          <Power size={11} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* EMPTY FILTER STATE */
          <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-4 font-mono">
            <div className="w-12 h-12 rounded-lg bg-cream border border-beige-deep flex items-center justify-center text-slate">
              <ShieldAlert size={20} className="text-accent-yellow" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-ink uppercase">No Matching Users</h3>
              <p className="text-[11px] text-slate max-w-sm">
                No users matched search string. Adjust search constraints.
              </p>
            </div>
            <button 
              onClick={() => { setSearchTerm(''); setPlanFilter('all'); setStatusFilter('all'); }}
              className="button-cream text-xs px-3 h-[30px]"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* PLAN EDIT MODAL (GLASSMORPHISM OVERLAY) */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-md">
          <div className="bg-surface border border-beige-deep rounded-lg w-full max-w-md overflow-hidden shadow-2xl relative">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-beige-deep bg-cream">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-primary" />
                <h3 className="text-heading-5 text-ink font-semibold">Modify Limits & Subscription</h3>
              </div>
              <button 
                onClick={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
                className="text-slate hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-4 text-left">
              <div>
                <span className="text-[9px] font-mono text-slate uppercase block">Target Account</span>
                <p className="font-bold text-ink text-sm">{selectedUser.name}</p>
                <p className="font-mono text-xs text-slate mt-0.5">{selectedUser.email}</p>
              </div>

              {/* Plan Choice */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate uppercase block">Select Plan Tier</label>
                <select
                  value={newPlan}
                  onChange={(e) => {
                    const p = e.target.value
                    setNewPlan(p)
                    setCustomLimit(p === 'enterprise' ? 10000000 : p === 'pro' ? 100000 : p === 'starter' ? 10000 : 500)
                  }}
                  className="w-full bg-surface text-xs text-ink px-3 py-2 rounded-md border border-beige-deep font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary h-[40px] transition-all"
                >
                  <option value="free">FREE (500 lifetime limit)</option>
                  <option value="starter">STARTER ($29/mo - 10K limit)</option>
                  <option value="pro">PRO ($99/mo - 100K limit)</option>
                  <option value="enterprise">ENTERPRISE (Custom limit)</option>
                </select>
              </div>

              {/* Rate Limit Info warning */}
              {selectedUser.usage > customLimit && (
                <div className="p-3 bg-accent-yellow/10 border border-accent-yellow/20 rounded-md flex gap-2 text-accent-yellow">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed font-mono">
                    <span className="font-bold block">Usage Limit Warning</span>
                    This user has consumed <span className="underline">{selectedUser.usage.toLocaleString()}</span> requests, which exceeds the limit (<span className="font-mono">{customLimit.toLocaleString()}</span>) for the selected plan tier.
                  </div>
                </div>
              )}

              <div className="p-3 bg-cream border border-beige-deep rounded-md text-slate text-[10px] leading-relaxed font-mono">
                Updates will propagate instantly. All user API keys mapped to this subscription profile will automatically update rate throttles within 3 seconds.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-cream border-t border-beige-deep flex justify-end gap-3">
              <button
                onClick={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
                className="button-ghost text-xs px-4 h-[36px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="button-primary text-xs px-4 h-[36px] font-semibold"
              >
                Save Updates
              </button>
            </div>

          </div>
        </div>
      )}

      {/* USER SESSION TELEMETRY MODAL (GLASSMORPHISM OVERLAY) */}
      {isTelemetryModalOpen && telemetryUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-md">
          <div className="bg-surface border border-beige-deep rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-fade-in">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-beige-deep bg-cream">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-primary animate-pulse" />
                <h3 className="text-heading-5 text-ink font-semibold">User Telemetry & Session Analytics</h3>
              </div>
              <button 
                onClick={() => { setIsTelemetryModalOpen(false); setTelemetryUser(null); }}
                className="text-slate hover:text-ink transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* User Overview Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-cream/40 border border-beige-deep/40 p-4 rounded-xl">
                <div>
                  <span className="text-[9px] font-mono text-slate uppercase block">Target Tenant</span>
                  <h4 className="font-bold text-ink text-base">{telemetryUser.name}</h4>
                  <p className="font-mono text-xs text-slate mt-0.5">{telemetryUser.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-cream border border-beige-deep text-slate">
                    Plan: {telemetryUser.plan.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-primary/10 border border-primary/20 text-primary">
                    Usage: {telemetryUser.usage.toLocaleString()} reqs
                  </span>
                </div>
              </div>

              {/* Vercel-style Telemetry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Geographic Metadata */}
                <div className="bg-[#121210] border border-hairline p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin size={14} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Geographic Location</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono text-slate">
                    <div className="flex justify-between">
                      <span className="opacity-60">Country:</span>
                      <span className="text-ink font-semibold">{telemetryUser.country || 'United States'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Region/State:</span>
                      <span className="text-ink font-semibold">{telemetryUser.region || 'California'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">City:</span>
                      <span className="text-ink font-semibold">{telemetryUser.city || 'Mountain View'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">ISP Network:</span>
                      <span className="text-ink font-semibold truncate max-w-[150px]" title={telemetryUser.isp}>{telemetryUser.isp || 'Google LLC'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Device & System Specs */}
                <div className="bg-[#121210] border border-hairline p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-accent-green">
                    <Monitor size={14} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Device & System</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono text-slate">
                    <div className="flex justify-between">
                      <span className="opacity-60">Device Type:</span>
                      <span className="text-ink font-semibold">{telemetryUser.device || 'Desktop'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Operating System:</span>
                      <span className="text-ink font-semibold">{telemetryUser.os || 'macOS'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Screen Resolution:</span>
                      <span className="text-ink font-semibold">{telemetryUser.screen_resolution || '1920x1080'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Screen Ratio:</span>
                      <span className="text-ink font-semibold">
                        {telemetryUser.screen_resolution 
                          ? (parseFloat(telemetryUser.screen_resolution.split('x')[0]) / parseFloat(telemetryUser.screen_resolution.split('x')[1])).toFixed(2) + ' (Landscape)'
                          : '1.78 (16:9)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Browser & Environment */}
                <div className="bg-[#121210] border border-hairline p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-accent-blue">
                    <Cpu size={14} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Browser Environment</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono text-slate">
                    <div className="flex justify-between">
                      <span className="opacity-60">Browser Name:</span>
                      <span className="text-ink font-semibold">{telemetryUser.browser || 'Google Chrome'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Language:</span>
                      <span className="text-ink font-semibold">{telemetryUser.language || 'en-US'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Timezone:</span>
                      <span className="text-ink font-semibold truncate max-w-[150px]">{telemetryUser.timezone || 'America/Los_Angeles'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">UTC Offset:</span>
                      <span className="text-ink font-semibold">
                        {telemetryUser.timezone 
                          ? new Date().toLocaleString('en-US', { timeZone: telemetryUser.timezone, timeZoneName: 'short' }).split(' ').pop() 
                          : 'GMT-7'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Session & Identity */}
                <div className="bg-[#121210] border border-hairline p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-purple-500">
                    <Clock size={14} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Active Connection</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono text-slate">
                    <div className="flex justify-between">
                      <span className="opacity-60">IP Address:</span>
                      <span className="text-ink font-semibold select-all">{telemetryUser.last_ip || '162.210.192.4'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Last Activity:</span>
                      <span className="text-ink font-semibold">{telemetryUser.last_login || 'Just now'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Joined:</span>
                      <span className="text-ink font-semibold">{telemetryUser.created_at}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Liveness State:</span>
                      <span className="text-accent-green font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"></span>
                        ONLINE
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* User Agent Raw String */}
              <div className="bg-[#121210] border border-hairline p-4 rounded-xl space-y-2 text-left">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-wider text-slate">
                  <span className="flex items-center gap-1.5">
                    <Globe size={13} />
                    Raw User-Agent Header
                  </span>
                  <button 
                    onClick={() => handleCopyUa(telemetryUser.user_agent || 'Mozilla/5.0')}
                    className="flex items-center gap-1 text-primary hover:text-primary-light transition-colors font-semibold cursor-pointer"
                  >
                    <Copy size={10} />
                    {copiedUa ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] font-mono text-steel break-all bg-canvas p-3 rounded-lg border border-hairline select-all leading-relaxed">
                  {telemetryUser.user_agent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'}
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-cream border-t border-beige-deep flex justify-end">
              <button
                onClick={() => { setIsTelemetryModalOpen(false); setTelemetryUser(null); }}
                className="button-primary text-xs px-5 h-[36px] font-semibold cursor-pointer"
              >
                Close Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
