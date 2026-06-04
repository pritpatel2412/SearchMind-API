import React, { useState } from 'react'
import { Users, Search, Edit3, Shield, Power, Check } from 'lucide-react'

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState([
    { id: '1', name: 'Alice Miller', email: 'alice@agentcorp.io', plan: 'pro', active: true, created_at: '2026-05-12' },
    { id: '2', name: 'Bob Smith', email: 'bob@flowai.dev', plan: 'starter', active: true, created_at: '2026-05-20' },
    { id: '3', name: 'Charlie Green', email: 'charlie@rag-pipeline.com', plan: 'enterprise', active: true, created_at: '2026-04-01' },
    { id: '4', name: 'David Lee', email: 'david@sandbox.net', plan: 'free', active: false, created_at: '2026-06-02' }
  ])

  const [editingUserId, setEditingUserId] = useState(null)
  const [tempPlan, setTempPlan] = useState('')

  const handleToggleActive = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u))
  }

  const handleSavePlan = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, plan: tempPlan } : u))
    setEditingUserId(null)
  }

  const filteredUsers = users.filter(
    u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Users className="text-violet-400" />
          User Accounts
        </h1>
        <p className="text-sm text-gray-400">View platform users, manage subscription levels, and activate/deactivate client keys access.</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 items-center max-w-md bg-black/40 px-3 py-2 rounded-xl border border-brand-border/60">
        <Search size={16} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search by name or email..."
          className="bg-transparent outline-none text-sm text-gray-300 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-2xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-border/40 text-sm">
            <thead className="bg-black/30 text-gray-400 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-left">Created</th>
                <th className="px-6 py-4 text-left">Plan Tier</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40 text-gray-300">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-200">{u.name}</td>
                  <td className="px-6 py-4 font-mono text-gray-400">{u.email}</td>
                  <td className="px-6 py-4 text-gray-400">{u.created_at}</td>
                  <td className="px-6 py-4">
                    {editingUserId === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="glass-input text-xs py-1"
                          value={tempPlan}
                          onChange={(e) => setTempPlan(e.target.value)}
                        >
                          <option value="free">Free</option>
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        <button
                          onClick={() => handleSavePlan(u.id)}
                          className="p-1 rounded bg-violet-600 hover:bg-violet-500 text-white"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        u.plan === 'enterprise' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' :
                        u.plan === 'pro' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                        u.plan === 'starter' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {u.plan}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                      {u.active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => { setEditingUserId(u.id); setTempPlan(u.plan); }}
                        className="p-1 text-gray-400 hover:text-violet-400 transition-colors"
                        title="Edit Plan"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(u.id)}
                        className={`p-1 transition-colors ${
                          u.active ? 'text-emerald-400 hover:text-red-400' : 'text-red-400 hover:text-emerald-400'
                        }`}
                        title={u.active ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
