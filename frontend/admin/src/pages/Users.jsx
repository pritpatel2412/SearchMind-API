import React, { useState, useEffect } from 'react'
import { Users, Search, Edit3, Shield, Power, Check, X, ShieldAlert, Key, UserCheck, AlertTriangle, Filter, Loader } from 'lucide-react'

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

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:8000/v1/admin/users')
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
      const res = await fetch(`http://localhost:8000/v1/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    setCustomLimit(user.plan === 'enterprise' ? 1000000 : user.plan === 'pro' ? 100000 : user.plan === 'starter' ? 50000 : 1000)
    setIsEditModalOpen(true)
  }

  // Save modified plan
  const handleSavePlan = async () => {
    if (!selectedUser) return
    try {
      const res = await fetch(`http://localhost:8000/v1/admin/users/${selectedUser.id}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
          <h1 className="text-4xl font-display font-medium text-ink flex items-center gap-2">
            User Accounts
          </h1>
          <p className="text-xs font-mono text-mute mt-1">
            Configure system-wide user subscriptions, keys volume, and operational limits.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-accent-red/5 border border-accent-red/20 rounded-lg flex items-start gap-3 text-accent-red font-sans text-xs z-10 relative">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block uppercase tracking-wider text-[10px]">Database Connection Degraded</span>
            <p className="text-ink/80 leading-relaxed">
              Failed to query telemetry logs: <span className="font-mono text-accent-red bg-accent-red/10 px-1 rounded">{error}</span>. Please verify that the SearchMind API server is running on port 8000.
            </p>
          </div>
        </div>
      )}

      {/* STATS METRIC ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        
        <div className="bg-surface-card border border-hairline-strong p-5 rounded-lg flex flex-col justify-between h-28 hover:border-hairline-strong/80 transition-colors">
          <span className="text-[9px] font-mono font-medium tracking-[0.8px] text-mute uppercase">Total Accounts</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-sans tracking-tight text-ink">{totalUsers}</span>
            <span className="text-[10px] font-sans font-medium text-accent-green">100% enabling</span>
          </div>
        </div>

        <div className="bg-surface-card border border-hairline-strong p-5 rounded-lg flex flex-col justify-between h-28 hover:border-hairline-strong/80 transition-colors">
          <span className="text-[9px] font-mono font-medium tracking-[0.8px] text-mute uppercase">Active Keys</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-sans tracking-tight text-ink">{activeCount}</span>
            <span className="text-[10px] font-sans font-medium text-mute">users online</span>
          </div>
        </div>

        <div className="bg-surface-card border border-hairline-strong p-5 rounded-lg flex flex-col justify-between h-28 hover:border-hairline-strong/80 transition-colors">
          <span className="text-[9px] font-mono font-medium tracking-[0.8px] text-mute uppercase">Premium Clients</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-sans tracking-tight text-ink">{premiumCount}</span>
            <span className="text-[10px] font-sans font-medium text-accent-blue">Pro / Enterprise</span>
          </div>
        </div>

        <div className="bg-surface-card border border-hairline-strong p-5 rounded-lg flex flex-col justify-between h-28 hover:border-hairline-strong/80 transition-colors">
          <span className="text-[9px] font-mono font-medium tracking-[0.8px] text-mute uppercase">Cumulative Vol</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-sans tracking-tight text-ink">{totalRequestsUsed.toLocaleString()}</span>
            <span className="text-[10px] font-sans font-medium text-accent-orange">requests</span>
          </div>
        </div>

      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-surface-card border border-hairline-strong p-4 rounded-lg flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between relative z-10">
        
        {/* Search */}
        <div className="flex-1 flex gap-2.5 items-center bg-surface-deep px-3 py-1.5 rounded-md border border-hairline-strong focus-within:border-ink transition-all">
          <Search size={12} className="text-mute" />
          <input
            type="text"
            placeholder="Filter accounts by email, user name..."
            className="bg-transparent outline-none text-xs text-ink w-full font-sans placeholder:text-mute"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-mute hover:text-ink">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-1.5 text-xs text-mute font-sans">
            <Filter size={11} className="text-mute" />
            <span className="font-medium">Filter:</span>
          </div>

          <div className="relative">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-surface-deep text-xs text-ink pl-3 pr-8 py-1.5 rounded border border-hairline-strong font-sans font-medium outline-none focus:border-ink cursor-pointer hover:bg-surface-elevated transition-colors appearance-none"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-mute">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-deep text-xs text-ink pl-3 pr-8 py-1.5 rounded border border-hairline-strong font-sans font-medium outline-none focus:border-ink cursor-pointer hover:bg-surface-elevated transition-colors appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-mute">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* USERS TABLE PANEL */}
      <div className="bg-surface-card rounded-lg border border-hairline-strong overflow-hidden relative z-10">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-4 font-mono">
            <Loader className="animate-spin text-accent-blue" size={24} />
            <p className="text-[11px] text-mute">Loading active subscriptions and key statistics...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-hairline-strong/60 text-xs">
              <thead className="bg-surface-deep text-mute font-mono uppercase text-[10px] tracking-wider">
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
              <tbody className="divide-y divide-hairline text-ink">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-elevated/40 transition-colors">
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-ink text-sm">{u.name}</span>
                        <span className="font-mono text-mute mt-0.5 text-xs">{u.email}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-mute font-mono">{u.created_at}</td>

                    <td className="px-6 py-4 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-surface-deep border border-hairline text-ink">
                        {u.keys_count} keys
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                        u.plan === 'enterprise' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        u.plan === 'pro' ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' :
                        u.plan === 'starter' ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20' :
                        'bg-surface-deep text-mute border border-hairline'
                      }`}>
                        {u.plan}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 w-32">
                        <div className="flex justify-between font-mono text-[9px] text-mute">
                          <span>{u.usage.toLocaleString()} reqs</span>
                        </div>
                        <div className="h-1 bg-surface-deep rounded-full overflow-hidden border border-hairline">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              u.plan === 'enterprise' ? 'bg-purple-400' :
                              u.plan === 'pro' ? 'bg-accent-green' :
                              u.plan === 'starter' ? 'bg-accent-blue' : 'bg-accent-orange'
                            }`}
                            style={{ width: `${Math.min(100, (u.usage / (u.plan === 'enterprise' ? 1000000 : u.plan === 'pro' ? 100000 : u.plan === 'starter' ? 50000 : 5000)) * 100)}%` }}
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
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded bg-surface-deep border border-hairline text-mute hover:text-accent-blue hover:border-accent-blue/30 transition-all"
                          title="Modify Quotas"
                        >
                          <Edit3 size={11} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u.id, u.active)}
                          className={`p-1.5 rounded bg-surface-deep border transition-all ${
                            u.active 
                              ? 'border-hairline text-mute hover:text-accent-red hover:border-accent-red/30' 
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
            <div className="w-12 h-12 rounded-lg bg-surface-deep border border-hairline flex items-center justify-center text-mute">
              <ShieldAlert size={20} className="text-accent-yellow" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-ink uppercase">No Matching Users</h3>
              <p className="text-[11px] text-mute max-w-sm">
                No users matched search string. Adjust search constraints.
              </p>
            </div>
            <button 
              onClick={() => { setSearchTerm(''); setPlanFilter('all'); setStatusFilter('all'); }}
              className="button-ghost text-xs px-3 h-[30px]"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* PLAN EDIT MODAL (GLASSMORPHISM OVERLAY) */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/85 backdrop-blur-md">
          <div className="bg-surface-card border border-hairline-strong rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-hairline bg-surface-deep/30">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-accent-blue" />
                <h3 className="font-semibold text-ink font-display text-sm">Modify Limits & Subscription</h3>
              </div>
              <button 
                onClick={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
                className="text-mute hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[9px] font-mono text-mute uppercase block">Target Account</span>
                <p className="font-bold text-ink text-sm">{selectedUser.name}</p>
                <p className="font-mono text-xs text-mute mt-0.5">{selectedUser.email}</p>
              </div>

              {/* Plan Choice */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-mute uppercase block">Select Plan Tier</label>
                <select
                  value={newPlan}
                  onChange={(e) => {
                    const p = e.target.value
                    setNewPlan(p)
                    setCustomLimit(p === 'enterprise' ? 1000000 : p === 'pro' ? 100000 : p === 'starter' ? 50000 : 1000)
                  }}
                  className="w-full bg-surface-deep text-xs text-ink px-3 py-2 rounded border border-hairline-strong font-mono outline-none focus:border-ink"
                >
                  <option value="free">FREE ($0/mo - 1K limit)</option>
                  <option value="starter">STARTER ($29/mo - 50K limit)</option>
                  <option value="pro">PRO ($99/mo - 100K limit)</option>
                  <option value="enterprise">ENTERPRISE (Custom limit)</option>
                </select>
              </div>

              {/* Rate Limit Info warning */}
              {selectedUser.usage > customLimit && (
                <div className="p-3 bg-accent-yellow/10 border border-accent-yellow/20 rounded flex gap-2 text-accent-yellow">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed font-mono">
                    <span className="font-bold block">Usage Limit Warning</span>
                    This user has consumed <span className="underline">{selectedUser.usage.toLocaleString()}</span> requests, which exceeds the limit (<span className="font-mono">{customLimit.toLocaleString()}</span>) for the selected plan tier.
                  </div>
                </div>
              )}

              <div className="p-3 bg-surface-deep border border-hairline rounded text-mute text-[10px] leading-relaxed font-mono">
                Updates will propagate instantly. All user API keys mapped to this subscription profile will automatically update rate throttles within 3 seconds.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-surface-deep/20 border-t border-hairline flex justify-end gap-3">
              <button
                onClick={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
                className="button-ghost text-xs px-4 h-[32px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="button-primary text-xs px-4 h-[32px] font-semibold"
              >
                Save Updates
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
