import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { Terminal } from 'lucide-react'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Playground from './pages/Playground.jsx'
import Docs from './pages/Docs.jsx'
import Pricing from './pages/Pricing.jsx'
import Terms from './pages/Terms.jsx'
import Privacy from './pages/Privacy.jsx'
import Auth from './pages/Auth.jsx'
import Features from './pages/Features.jsx'
import Reliability from './pages/Reliability.jsx'
import Latency from './pages/Latency.jsx'
import Caching from './pages/Caching.jsx'
import UseCases from './pages/UseCases.jsx'
import PythonSDK from './pages/PythonSDK.jsx'
import Status from './pages/Status.jsx'

function HashScroll() {
  const { hash, pathname } = useLocation()

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [hash, pathname])

  return null
}

function AppContent({ token, setToken, user, setUser, apiKey, setApiKey, handleLogout }) {
  const location = useLocation()
  const isAuthPage = location.pathname === '/auth'

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar token={token} user={user} onLogout={handleLogout} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home token={token} />} />
          <Route 
            path="/dashboard" 
            element={token ? <Dashboard token={token} user={user} apiKey={apiKey} setApiKey={setApiKey} /> : <Navigate to="/auth?mode=login" />} 
          />
          <Route 
            path="/playground" 
            element={token ? <Playground token={token} apiKey={apiKey} /> : <Navigate to="/auth?mode=login" />} 
          />
          <Route 
            path="/auth" 
            element={token ? <Navigate to="/dashboard" /> : <Auth setToken={setToken} setUser={setUser} setApiKey={setApiKey} />} 
          />
          <Route path="/docs" element={<Docs apiKey={apiKey} />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/features" element={<Features />} />
          <Route path="/reliability" element={<Reliability />} />
          <Route path="/latency" element={<Latency />} />
          <Route path="/caching" element={<Caching />} />
          <Route path="/use-cases" element={<UseCases />} />
          <Route path="/python-sdk" element={<PythonSDK />} />
          <Route path="/status" element={<Status />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      
      {!isAuthPage && (
        <>
          {/* Sunset Stripe Brand continuity band */}
          <div className="w-full sunset-stripe-band" />

          {/* Footer */}
          <footer className="bg-cream border-t border-beige-deep py-16 px-6 md:px-12 text-left text-sm text-slate font-sans">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 border-b border-beige-deep/50 pb-12 mb-8">
              {/* Brand Column */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <img src="/logo-new.png" alt="SearchMind Logo" className="h-16 w-auto" />
                </div>
                <p className="text-xs text-steel leading-relaxed max-w-[200px]">
                  Frontier web search layer built specifically for autonomous agents and LLM orchestration.
                </p>
              </div>
              
              {/* Column 2 */}
              <div className="flex flex-col gap-3">
                <span className="font-semibold text-xs tracking-wider text-ink uppercase font-mono">Why SearchMind</span>
                <Link to="/features" className="text-xs text-slate hover:text-primary transition-colors">Features</Link>
                <Link to="/reliability" className="text-xs text-slate hover:text-primary transition-colors">Reliability</Link>
                <Link to="/latency" className="text-xs text-slate hover:text-primary transition-colors">Latency</Link>
                <Link to="/caching" className="text-xs text-slate hover:text-primary transition-colors">Caching</Link>
              </div>

              {/* Column 3 */}
              <div className="flex flex-col gap-3">
                <span className="font-semibold text-xs tracking-wider text-ink uppercase font-mono">Explore</span>
                <Link to="/playground" className="text-xs text-slate hover:text-primary transition-colors">Playground</Link>
                <Link to="/pricing" className="text-xs text-slate hover:text-primary transition-colors">Pricing</Link>
                <Link to="/use-cases" className="text-xs text-slate hover:text-primary transition-colors">Use Cases</Link>
              </div>

              {/* Column 4 */}
              <div className="flex flex-col gap-3">
                <span className="font-semibold text-xs tracking-wider text-ink uppercase font-mono">Build</span>
                <Link to="/docs" className="text-xs text-slate hover:text-primary transition-colors">API Reference</Link>
                <Link to="/python-sdk" className="text-xs text-slate hover:text-primary transition-colors">Python SDK</Link>
                <Link to="/status" className="text-xs text-slate hover:text-primary transition-colors">System Status</Link>
              </div>

              {/* Column 5 */}
              <div className="flex flex-col gap-3">
                <span className="font-semibold text-xs tracking-wider text-ink uppercase font-mono">Legal</span>
                <Link to="/terms" className="text-xs text-slate hover:text-primary transition-colors">Terms of Service</Link>
                <Link to="/privacy" className="text-xs text-slate hover:text-primary transition-colors">Privacy Policy</Link>
                <a href="mailto:support@searchmind.dev" className="text-xs text-slate hover:text-primary transition-colors">Contact Support</a>
              </div>
            </div>

            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-steel font-mono">
              <p>&copy; {new Date().getFullYear()} SearchMind API. All rights reserved.</p>
              <div className="flex gap-4">
                <span>English (US)</span>
                <span>&middot;</span>
                <span className="text-primary font-semibold">Frontier Search Layer</span>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('sm_token') || '')
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('sm_user') || 'null'))
  const [apiKey, setApiKey] = useState(localStorage.getItem('sm_api_key') || '')

  useEffect(() => {
    if (token) {
      localStorage.setItem('sm_token', token)
    } else {
      localStorage.removeItem('sm_token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('sm_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('sm_user')
    }
  }, [user])

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('sm_api_key', apiKey)
    } else {
      localStorage.removeItem('sm_api_key')
    }
  }, [apiKey])

  const handleLogout = () => {
    setToken('')
    setUser(null)
    setApiKey('')
    localStorage.removeItem('sm_token')
    localStorage.removeItem('sm_user')
    localStorage.removeItem('sm_api_key')
  }

  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <HashScroll />
      <AppContent 
        token={token} 
        setToken={setToken} 
        user={user} 
        setUser={setUser} 
        apiKey={apiKey} 
        setApiKey={setApiKey} 
        handleLogout={handleLogout} 
      />
    </Router>
  )
}
