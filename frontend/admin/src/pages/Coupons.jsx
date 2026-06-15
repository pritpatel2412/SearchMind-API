import React, { useState, useEffect } from 'react'
import { Ticket, Plus, Trash2, Calendar, Users, CheckCircle2, Clock, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form fields state
  const [code, setCode] = useState('')
  const [targetPlan, setTargetPlan] = useState('pro')
  const [maxRedemptions, setMaxRedemptions] = useState(50)
  const [durationDays, setDurationDays] = useState(30)
  const [validFrom, setValidFrom] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0] // today
  })
  const [validTo, setValidTo] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 3) // 3 months from now
    return d.toISOString().split('T')[0]
  })

  const fetchCoupons = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/v1/admin/coupons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch coupons')
      const data = await res.json()
      setCoupons(data)
    } catch (e) {
      setError('Could not retrieve coupon lists: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCoupon = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Coupon code cannot be empty')
      return
    }
    setSubmitLoading(true)
    setError('')
    setSuccess('')

    const payload = {
      code: code.trim().toUpperCase(),
      target_plan: targetPlan,
      max_redemptions: parseInt(maxRedemptions, 10),
      duration_days: parseInt(durationDays, 10),
      valid_from: new Date(validFrom).toISOString(),
      valid_to: new Date(validTo).toISOString()
    }

    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/v1/admin/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create coupon')
      }
      setSuccess(`Successfully created coupon code: ${code.toUpperCase()}`)
      setCode('')
      fetchCoupons()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon? All active users on this coupon will remain on their plan until checking/expiration, but no new users can redeem this code.')) {
      return
    }
    setError('')
    setSuccess('')
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/v1/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to delete coupon')
      }
      setSuccess('Coupon deleted successfully.')
      fetchCoupons()
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const isCouponActive = (c) => {
    if (!c.is_active) return false
    const now = new Date()
    const fromDate = new Date(c.valid_from)
    const toDate = new Date(c.valid_to)
    if (now < fromDate || now > toDate) return false
    if (c.redemption_count >= c.max_redemptions) return false
    return true
  }

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto relative glow-orange">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-heading-1 text-ink flex items-center gap-2">
            Coupon Management
          </h1>
          <p className="text-caption text-slate mt-1">
            Provision, monitor, and manage limited-edition access codes and plan incentives.
          </p>
        </div>
        <button
          onClick={fetchCoupons}
          disabled={loading}
          className="button-cream text-xs font-sans font-medium h-[38px] px-4"
        >
          <RefreshCw size={11} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-accent-red/5 border border-accent-red/20 rounded-lg flex items-start gap-3 text-accent-red font-sans text-xs relative z-10">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block uppercase tracking-wider text-[10px]">Action Failed</span>
            <p className="text-ink/80 leading-relaxed mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-accent-green/5 border border-accent-green/20 rounded-lg flex items-start gap-3 text-accent-green font-sans text-xs relative z-10">
          <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block uppercase tracking-wider text-[10px]">Action Succeeded</span>
            <p className="text-ink/80 leading-relaxed mt-0.5">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative z-10">
        
        {/* CREATE COUPON CARD */}
        <div className="card-base p-6 rounded-lg border border-hairline-soft bg-surface space-y-6 lg:col-span-1">
          <div className="flex items-center gap-2 text-ink font-bold text-xs font-mono border-b border-beige-deep pb-3">
            <Plus size={14} className="text-primary" />
            Generate New Coupon
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-steel font-mono uppercase text-[10px]">Coupon Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SUMMER50"
                className="w-full bg-surface-code text-ink border border-hairline-strong rounded px-3 py-2 font-mono h-10 outline-none focus:border-primary uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-steel font-mono uppercase text-[10px]">Target Plan</label>
                <select
                  value={targetPlan}
                  onChange={(e) => setTargetPlan(e.target.value)}
                  className="w-full bg-surface-code text-ink border border-hairline-strong rounded px-2.5 py-2 font-sans h-10 outline-none focus:border-primary"
                >
                  <option value="pro">Pro Access</option>
                  <option value="starter">Starter Access</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-steel font-mono uppercase text-[10px]">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full bg-surface-code text-ink border border-hairline-strong rounded px-3 py-2 font-mono h-10 outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-steel font-mono uppercase text-[10px]">Max Redemption Count</label>
              <input
                type="number"
                min="1"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                className="w-full bg-surface-code text-ink border border-hairline-strong rounded px-3 py-2 font-mono h-10 outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-steel font-mono uppercase text-[10px]">Valid From</label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full bg-surface-code text-ink border border-hairline-strong rounded px-3 py-2 font-mono h-10 outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-steel font-mono uppercase text-[10px]">Valid To (Expiry)</label>
                <input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="w-full bg-surface-code text-ink border border-hairline-strong rounded px-3 py-2 font-mono h-10 outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="button-primary w-full h-[40px] font-sans font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 mt-2"
            >
              {submitLoading ? (
                <>
                  <RefreshCw size={11} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={11} />
                  Deploy Code
                </>
              )}
            </button>
          </form>
        </div>

        {/* LIST OF COUPONS */}
        <div className="card-base p-6 rounded-lg border border-hairline-soft bg-surface lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-beige-deep pb-3">
            <div className="flex items-center gap-2 text-ink font-bold text-xs font-mono">
              <Ticket size={14} className="text-primary" />
              Active Coupon Registry
            </div>
            <span className="text-[10px] font-mono text-slate bg-cream border border-beige-deep px-2 py-0.5 rounded">
              {coupons.length} Mapped Codes
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate space-y-2 font-mono text-xs">
              <RefreshCw size={20} className="animate-spin text-primary" />
              <span>Fetching coupons...</span>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12 text-slate font-mono text-xs">
              No promo codes found in registry. Create one using the form on the left!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-beige-deep text-steel uppercase text-[9px] tracking-wider">
                    <th className="py-2.5 pb-2 font-semibold">Code</th>
                    <th className="py-2.5 pb-2 font-semibold">Incentive</th>
                    <th className="py-2.5 pb-2 font-semibold text-center">Duration</th>
                    <th className="py-2.5 pb-2 font-semibold text-center">Redeemed</th>
                    <th className="py-2.5 pb-2 font-semibold">Validity</th>
                    <th className="py-2.5 pb-2 font-semibold text-center">Status</th>
                    <th className="py-2.5 pb-2 font-semibold text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft">
                  {coupons.map((c) => {
                    const active = isCouponActive(c)
                    return (
                      <tr key={c.id} className="hover:bg-cream-soft/30 transition-colors group">
                        <td className="py-3 pr-2 font-bold text-ink group-hover:text-primary transition-colors">
                          {c.code}
                        </td>
                        <td className="py-3 text-slate">
                          <span className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold uppercase">
                            {c.target_plan}
                          </span>
                        </td>
                        <td className="py-3 text-center text-slate">
                          {c.duration_days} days
                        </td>
                        <td className="py-3 text-center text-slate font-sans">
                          <span className="font-semibold text-ink">{c.redemption_count}</span>
                          <span className="text-steel"> / {c.max_redemptions}</span>
                        </td>
                        <td className="py-3 text-slate text-[10px]">
                          <div className="flex flex-col">
                            <span>F: {c.valid_from.split('T')[0]}</span>
                            <span>T: {c.valid_to.split('T')[0]}</span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-sans font-bold uppercase ${
                            active
                              ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                              : 'bg-cream text-slate border border-beige-deep'
                          }`}>
                            {active ? 'ACTIVE' : 'EXPIRED'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="p-1 rounded bg-cream-soft border border-beige-deep hover:bg-accent-red/10 text-slate hover:text-accent-red transition-all cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
