import React, { useState } from 'react'
import { ShieldCheck, Lock, Mail, Loader } from 'lucide-react'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
      const res = await fetch(`${apiUrl}/v1/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!res.ok) {
        throw new Error('Invalid admin credentials')
      }

      const data = await res.json()
      onLogin(data.access_token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 selection:bg-primary/20">
      <div className="w-full max-w-md bg-surface border border-beige-deep rounded-2xl p-8 shadow-sm">
        
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-new.png" alt="SearchMind Logo" className="h-12 w-auto mb-2" />
          <span className="text-xs font-mono font-bold text-primary tracking-wider uppercase mb-2">Admin Console</span>
          <p className="text-slate text-sm mt-1">Sign in to access the control panel</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg text-accent-red text-sm flex items-start gap-2">
            <Lock size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold uppercase text-slate tracking-wider block">Admin Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
              <input
                type="email"
                required
                className="w-full bg-cream text-ink border border-beige-deep rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-sans"
                placeholder="pritptl2412@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold uppercase text-slate tracking-wider block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
              <input
                type="password"
                required
                className="w-full bg-cream text-ink border border-beige-deep rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-sans"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : 'Authenticate'}
          </button>
        </form>

      </div>
    </div>
  )
}
