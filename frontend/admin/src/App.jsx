import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { Users, BarChart3, ShieldCheck, Activity, Terminal, ExternalLink, Settings, LogOut, CheckCircle, RefreshCw, Ticket } from 'lucide-react'
import UsersPage from './pages/Users.jsx'
import AnalyticsPage from './pages/Analytics.jsx'
import SystemHealthPage from './pages/SystemHealth.jsx'
import NotFound from './pages/NotFound.jsx'
import CouponsPage from './pages/Coupons.jsx'
import Login from './pages/Login.jsx'

function AdminLayout({ children, onLogout }) {
  const location = useLocation()
  const currentPath = location.pathname
  const [systemStatus, setSystemStatus] = useState('healthy')
  const [lastCheck, setLastCheck] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
        const res = await fetch(`${apiUrl}/health`)
        if (res.ok) {
          const data = await res.json()
          setSystemStatus(data.status === 'ok' ? 'healthy' : 'degraded')
        } else {
          setSystemStatus('down')
        }
      } catch (e) {
        setSystemStatus('down')
      }
      setLastCheck(new Date().toLocaleTimeString())
    }
    
    checkHealth()
    const interval = setInterval(checkHealth, 15000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { label: 'User Accounts', path: '/users', icon: Users },
    { label: 'Platform Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Promo Coupons', path: '/coupons', icon: Ticket },
    { label: 'System Health', path: '/system', icon: Activity, badge: systemStatus }
  ]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-canvas text-ink font-sans selection:bg-primary/20">
      
      {/* LEFT SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-cream border-r border-beige-deep h-screen sticky top-0">
        
        {/* Branding header */}
        <div className="p-6 border-b border-beige-deep bg-cream/40">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo-new.png" alt="SearchMind Logo" className="h-8 w-auto group-hover:scale-105 transition-transform duration-300" />
            <div className="flex flex-col">
              <span className="text-micro-uppercase text-slate mt-0.5">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 border rounded-md text-body-sm-medium transition-all group ${
                  isActive
                    ? 'bg-cream-deeper text-ink border-beige-deep shadow-sm'
                    : 'text-charcoal border-transparent hover:text-ink hover:bg-cream-deeper/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={12} className={isActive ? 'text-primary' : 'text-slate group-hover:text-ink'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="flex items-center">
                    <span className={`w-1.5 h-1.5 rounded-full relative flex`}>
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        item.badge === 'healthy' ? 'bg-accent-green' :
                        item.badge === 'degraded' ? 'bg-accent-yellow' : 'bg-accent-red'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        item.badge === 'healthy' ? 'bg-accent-green' :
                        item.badge === 'degraded' ? 'bg-accent-yellow' : 'bg-accent-red'
                      }`}></span>
                    </span>
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* System Uptime status widget */}
        <div className="p-4 mx-4 mb-2 bg-cream-soft border border-beige-deep rounded-lg">
          <div className="flex items-center gap-2 mb-1.5 font-sans">
            <span className={`w-1.5 h-1.5 rounded-full ${
              systemStatus === 'healthy' ? 'bg-accent-green animate-pulse' :
              systemStatus === 'degraded' ? 'bg-accent-yellow' : 'bg-accent-red'
            }`}></span>
            <span className="text-micro-uppercase text-ink">
              {systemStatus === 'healthy' ? 'ALL SYSTEMS OK' :
               systemStatus === 'degraded' ? 'DEGRADED SERVICE' : 'SYSTEM OFFLINE'}
            </span>
          </div>
          <p className="text-micro text-slate">
            Heartbeat check: <span className="text-ink">{lastCheck}</span>
          </p>
        </div>

        {/* Sidebar Footer / Profile */}
        <div className="p-4 border-t border-beige-deep bg-cream/40 flex flex-col gap-3">
          <div className="flex items-center justify-between font-sans">
            <div className="flex flex-col">
              <span className="text-micro text-ink font-bold">root_admin</span>
              <span className="text-micro text-slate">system-level ops</span>
            </div>
            <a 
              href="http://localhost:5173" 
              target="_blank" 
              rel="noreferrer"
              className="p-1.5 rounded bg-cream-soft border border-beige-deep hover:bg-cream-deeper text-primary transition-colors"
              title="Developer Portal"
            >
              <ExternalLink size={11} />
            </a>
          </div>
          <button 
            onClick={onLogout}
            className="button-ghost text-micro font-sans h-[30px] font-semibold flex items-center justify-center cursor-pointer"
          >
            <LogOut size={11} className="mr-1.5 text-accent-red" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-beige-deep px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo-new.png" alt="SearchMind Logo" className="h-6 w-auto" />
          <span className="font-extrabold text-sm tracking-tight font-display text-ink">
            <span className="text-[9px] font-mono text-primary">ADMIN</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${
            systemStatus === 'healthy' ? 'bg-accent-green' :
            systemStatus === 'degraded' ? 'bg-accent-yellow' : 'bg-accent-red'
          }`}></span>
          <span className="text-[9px] font-mono text-slate">{lastCheck}</span>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 md:py-12 bg-canvas">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-beige-deep bg-cream/95 backdrop-blur flex justify-around py-2.5 text-[9px] font-mono text-slate">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.path
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 transition-all ${
                isActive ? 'text-ink font-bold scale-105' : 'hover:text-ink'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-primary' : 'text-slate'} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Padding space for mobile bottom navbar */}
      <div className="md:hidden h-16 w-full"></div>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'))

  const handleLogin = (newToken) => {
    localStorage.setItem('adminToken', newToken)
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setToken(null)
  }

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Router>
      <AdminLayout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/users" replace />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/system" element={<SystemHealthPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AdminLayout>
    </Router>
  )
}

