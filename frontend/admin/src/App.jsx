import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { Users, BarChart3, ShieldCheck, Activity, Terminal, ExternalLink, Settings, LogOut, CheckCircle, RefreshCw } from 'lucide-react'
import UsersPage from './pages/Users.jsx'
import AnalyticsPage from './pages/Analytics.jsx'
import SystemHealthPage from './pages/SystemHealth.jsx'

function AdminLayout({ children }) {
  const location = useLocation()
  const currentPath = location.pathname
  const [systemStatus, setSystemStatus] = useState('healthy')
  const [lastCheck, setLastCheck] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:8000/health')
        if (res.ok) {
          setSystemStatus('healthy')
        } else {
          setSystemStatus('degraded')
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
    { label: 'System Health', path: '/system', icon: Activity, badge: systemStatus }
  ]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-canvas text-ink font-sans selection:bg-accent-blue/20">
      
      {/* LEFT SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-card border-r border-hairline-strong h-screen sticky top-0">
        
        {/* Branding header */}
        <div className="p-6 border-b border-hairline-strong bg-canvas/30">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded bg-ink text-canvas group-hover:scale-105 transition-transform duration-300">
              <ShieldCheck size={14} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight font-display text-ink leading-none">
                SearchMind
              </span>
              <span className="text-[8px] font-mono font-bold tracking-widest text-mute uppercase mt-1">
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
                className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-mono font-medium transition-all group ${
                  isActive
                    ? 'bg-surface-elevated text-ink border border-hairline-strong'
                    : 'text-charcoal hover:text-ink hover:bg-surface-card'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={12} className={isActive ? 'text-accent-blue' : 'text-mute group-hover:text-ink'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="flex items-center">
                    <span className={`w-2 h-2 rounded-full relative flex`}>
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        item.badge === 'healthy' ? 'bg-accent-green' :
                        item.badge === 'degraded' ? 'bg-accent-yellow' : 'bg-accent-red'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
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
        <div className="p-4 mx-4 mb-2 bg-surface-deep border border-hairline rounded-lg">
          <div className="flex items-center gap-2 mb-1.5 font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${
              systemStatus === 'healthy' ? 'bg-accent-green animate-pulse' :
              systemStatus === 'degraded' ? 'bg-accent-yellow' : 'bg-accent-red'
            }`}></span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-ink">
              {systemStatus === 'healthy' ? 'ALL SYSTEMS OK' :
               systemStatus === 'degraded' ? 'DEGRADED SERVICE' : 'SYSTEM OFFLINE'}
            </span>
          </div>
          <p className="text-[9px] font-mono text-mute">
            Heartbeat check: <span className="text-ink">{lastCheck}</span>
          </p>
        </div>

        {/* Sidebar Footer / Profile */}
        <div className="p-4 border-t border-hairline-strong bg-canvas/30 flex flex-col gap-3">
          <div className="flex items-center justify-between font-mono">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-ink">root_admin</span>
              <span className="text-[9px] text-mute">system-level ops</span>
            </div>
            <a 
              href="http://localhost:5173" 
              target="_blank" 
              rel="noreferrer"
              className="p-1.5 rounded bg-surface-deep border border-hairline hover:bg-surface-elevated text-accent-blue transition-colors"
              title="Developer Portal"
            >
              <ExternalLink size={11} />
            </a>
          </div>
          <button className="button-ghost text-[10px] font-mono h-[30px] font-semibold flex items-center justify-center">
            <LogOut size={11} className="mr-1.5 text-accent-red" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-40 bg-surface-card/95 backdrop-blur border-b border-hairline-strong px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-ink text-canvas">
            <ShieldCheck size={14} />
          </div>
          <span className="font-extrabold text-sm tracking-tight font-display text-ink">
            SearchMind <span className="text-[9px] font-mono text-accent-blue">ADMIN</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${
            systemStatus === 'healthy' ? 'bg-accent-green' :
            systemStatus === 'degraded' ? 'bg-accent-yellow' : 'bg-accent-red'
          }`}></span>
          <span className="text-[9px] font-mono text-mute">{lastCheck}</span>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 md:py-12 bg-canvas">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-surface-card/95 backdrop-blur flex justify-around py-2.5 text-[9px] font-mono text-mute">
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
              <Icon size={13} className={isActive ? 'text-accent-blue' : 'text-mute'} />
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
  return (
    <Router>
      <AdminLayout>
        <Routes>
          <Route path="/users" element={<UsersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/system" element={<SystemHealthPage />} />
          <Route path="*" element={<Navigate to="/users" />} />
        </Routes>
      </AdminLayout>
    </Router>
  )
}
