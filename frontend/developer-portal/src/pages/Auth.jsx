import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Terminal, ArrowRight, ShieldCheck, Sparkles, Check, Cpu, Key, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

const testimonials = [
  {
    quote: "We plugged SearchMind into our LangGraph customer support agent, and it cut retrieval failures to zero. The multi-provider fallback is bulletproof.",
    author: "Elena Rostova",
    role: "Principal AI Engineer • VeloFlow",
    initials: "ER"
  },
  {
    quote: "Handling headless client-side JavaScript crawling was a massive headache. SearchMind's automatic Playwright rendering works flawlessly.",
    author: "Marcus Vance",
    role: "CTO • Cognition Labs",
    initials: "MV"
  },
  {
    quote: "With SearchMind, we get sanitized, LLM-ready body extraction in under 200ms. It has simplified our RAG pipeline significantly.",
    author: "Aarav Patel",
    role: "Lead Platform Architect • CodeGuard",
    initials: "AP"
  },
  {
    quote: "The parallelized multi-query research endpoint is a game changer. It performs deep searches across multiple sources in seconds.",
    author: "Sarah Jenkins",
    role: "AI Research Lead • DeepNexus",
    initials: "SJ"
  }
]

export default function Auth({ setToken, setUser, setApiKey }) {
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'login' ? false : true // default to register (Start Free)
  const [isRegister, setIsRegister] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')

  const calculateStrength = (pass) => {
    let score = 0
    if (pass.length >= 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    return score
  }
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0)
  const [fadeState, setFadeState] = useState('fade-in') // 'fade-in' | 'fade-out'
  const navigate = useNavigate()

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('fade-out')
      setTimeout(() => {
        setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length)
        setFadeState('fade-in')
      }, 500) // matches transition duration
    }, 5000) // stay for 5 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'login') {
      setIsRegister(false)
    } else if (mode === 'register') {
      setIsRegister(true)
    }
  }, [searchParams])

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (calculateStrength(password) < 4) {
        setError('Password must be at least 8 chars, contain an uppercase letter, a number, and a special character.')
        return
      }
    }

    setLoading(true)

    const endpoint = isRegister ? '/v1/auth/register' : '/v1/auth/login'
    const body = isRegister
      ? { email, password, full_name: fullName }
      : { email, password }

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed')
      }

      setToken(data.access_token)
      setUser({ id: data.user_id, email: data.email, plan: data.plan })

      if (data.full_key) {
        setApiKey(data.full_key)
      } else {
        await fetchKeys(data.access_token)
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchKeys = async (tokenStr) => {
    try {
      const res = await fetch('http://localhost:8000/v1/api-keys', {
        headers: { 'Authorization': `Bearer ${tokenStr}` }
      })
      const data = await res.json()
      if (res.ok && data.length > 0) {
        setApiKey(data[0].full_key || '')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Pre-fill fields for a quick demo user to test the webapp
  const handleQuickDemo = () => {
    setIsRegister(false)
    setEmail('demo@searchmind.dev')
    setPassword('demopass123')
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row relative overflow-hidden font-sans">

      {/* Background radial accent glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-blue/5 blur-[100px] pointer-events-none"></div>

      {/* LEFT PANEL: Testimony, Stats, Brand Showcase */}
      <div className="lg:w-[45%] bg-cream border-r border-hairline relative flex flex-col justify-between p-8 md:p-12 overflow-hidden shrink-0">

        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none select-none mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 0), radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px'
          }}
        ></div>

        {/* Middle: Brand Pitch and Testimonial Quote */}
        <div className="relative z-10 mt-4 md:mt-8 mb-auto py-4 space-y-12">

          {/* Animated decorative element */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono tracking-wider animate-pulse">
            <Sparkles size={10} className="text-primary" />
            <span>COMMITTED TO AGENT ERGONOMICS</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-display-lg text-ink font-light leading-tight">
              The Search Engine <br />
              <span className="font-serif italic text-primary">built for AI Agents</span>.
            </h2>
            <p className="text-body-md text-slate leading-relaxed max-w-md">
              Integrate real-time web access, structured scrapers, and parallel research loops into your RAG pipelines with sub-200ms latency.
            </p>
          </div>

          {/* Testimonial block (animated loop) */}
          <div className="min-h-[140px] flex flex-col justify-between">
            <div className={`border-l-2 border-primary/40 pl-6 space-y-4 transition-all duration-500 transform ${fadeState === 'fade-in' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
              <p className="text-body-sm text-charcoal italic leading-relaxed font-serif">
                "{testimonials[currentTestimonialIndex].quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center font-bold text-xs text-primary font-mono select-none">
                  {testimonials[currentTestimonialIndex].initials}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink">{testimonials[currentTestimonialIndex].author}</h4>
                  <p className="text-[10px] text-steel font-mono">{testimonials[currentTestimonialIndex].role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Feature highlights */}
        <div className="relative z-10 pt-4 border-t border-hairline flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-mono text-slate">
          <span className="flex items-center gap-1.5">
            <Check size={10} className="text-accent-green" /> 1,000 Free Queries/mo
          </span>
          <span className="text-steel">&bull;</span>
          <span className="flex items-center gap-1.5">
            <Check size={10} className="text-accent-green" /> LangGraph & LangChain Ready
          </span>
        </div>

      </div>

      {/* RIGHT PANEL: Form Container */}
      <div className="flex-grow flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="max-w-md w-full space-y-8">

          {/* Form Header */}
          <div className="text-center space-y-2">
            <h1 className="text-heading-2 text-ink font-semibold">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-caption text-slate">
              {isRegister
                ? 'Sign up to get 1,000 free search API queries every month.'
                : 'Sign in to access your developer portal console.'
              }
            </p>
          </div>

          {/* Dedicated Tab Bar - Custom Sliding Line */}
          <div className="relative flex border-b border-hairline pb-2">
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 pb-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors ${isRegister ? 'text-primary' : 'text-slate hover:text-ink'
                }`}
            >
              Register
            </button>
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 pb-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors ${!isRegister ? 'text-primary' : 'text-slate hover:text-ink'
                }`}
            >
              Sign In
            </button>
            {/* Smooth transition underline */}
            <div
              className={`absolute bottom-0 h-[2px] bg-primary transition-all duration-300`}
              style={{
                width: '50%',
                left: isRegister ? '0%' : '50%'
              }}
            ></div>
          </div>

          {error && (
            <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs rounded font-mono text-center animate-shake">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">

            {isRegister && (
              <div className="flex flex-col gap-1.5">
                <label className="text-micro-uppercase text-slate flex items-center gap-1.5">
                  <User size={12} className="text-steel" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Try"
                  className="glass-input w-full focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(241,90,36,0.1)] transition-all px-4 font-sans"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-micro-uppercase text-slate flex items-center gap-1.5">
                <Mail size={12} className="text-steel" />
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="try.prit24@gmail.com"
                className="glass-input w-full focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(241,90,36,0.1)] transition-all px-4 font-sans"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-micro-uppercase text-slate flex items-center gap-1.5">
                <Lock size={12} className="text-steel" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="glass-input w-full focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(241,90,36,0.1)] transition-all px-4 pr-10 font-sans"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-primary transition-colors focus:outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {isRegister && password && (
                <div className="flex gap-1 mt-1">
                  {[...Array(4)].map((_, i) => {
                    const strength = calculateStrength(password)
                    let color = 'bg-white/10'
                    if (i < strength) {
                      color = strength < 3 ? 'bg-accent-yellow' : 'bg-accent-green'
                    }
                    return <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${color}`} />
                  })}
                </div>
              )}
            </div>

            {isRegister && (
              <div className="flex flex-col gap-1.5">
                <label className="text-micro-uppercase text-slate flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-steel" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="glass-input w-full focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(241,90,36,0.1)] transition-all px-4 pr-10 font-sans"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="button-primary w-full mt-6 font-semibold flex items-center justify-center gap-2 shadow-glow hover:brightness-105 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill (for testing convenience) */}
          <div className="pt-4 text-center">
            <button
              onClick={handleQuickDemo}
              className="text-xs text-primary/80 hover:text-primary transition-colors font-mono hover:underline"
            >
              &gt; Auto-fill with local demo credentials
            </button>
          </div>

          {/* Footer Terms */}
          <p className="text-[11px] text-center text-steel font-sans leading-relaxed pt-6 border-t border-hairline">
            By accessing SearchMind, you agree to our{' '}
            <Link to="/terms" className="text-slate hover:text-primary transition-colors underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-slate hover:text-primary transition-colors underline">Privacy Policy</Link>.
          </p>

        </div>
      </div>

    </div>
  )
}
