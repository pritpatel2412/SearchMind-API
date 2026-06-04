import React from 'react'
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Users, BarChart3, ShieldCheck, Activity } from 'lucide-react'
import UsersPage from './pages/Users.jsx'
import AnalyticsPage from './pages/Analytics.jsx'
import SystemHealthPage from './pages/SystemHealth.jsx'

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Admin Navigation */}
        <nav className="sticky top-0 z-40 w-full border-b border-brand-border bg-[#0b0f19]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center gap-2 group">
                  <div className="p-1.5 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-600 text-white font-bold group-hover:scale-105 transition-transform duration-300">
                    <ShieldCheck size={20} />
                  </div>
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    SearchMind <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-violet-500/20 text-violet-400 bg-violet-500/5">Admin</span>
                  </span>
                </Link>

                <div className="hidden md:block ml-10">
                  <div className="flex items-baseline space-x-4">
                    <Link
                      to="/users"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/40"
                    >
                      <Users size={14} />
                      User Accounts
                    </Link>
                    <Link
                      to="/analytics"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/40"
                    >
                      <BarChart3 size={14} />
                      Platform Analytics
                    </Link>
                    <Link
                      to="/system"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/40"
                    >
                      <Activity size={14} />
                      System Health
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow">
          <Routes>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/system" element={<SystemHealthPage />} />
            <Route path="*" element={<Navigate to="/users" />} />
          </Routes>
        </main>

        <footer className="border-t border-brand-border py-6 bg-brand-dark/40 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} SearchMind API internal operations. Restricted Access.</p>
        </footer>
      </div>
    </Router>
  )
}
