import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Terminal, Key, Play, BookOpen, LogOut, ShieldAlert } from 'lucide-react'

export default function Navbar({ token, user, onLogout }) {
  const location = useLocation()
  const currentPath = location.pathname

  const navItems = [
    { label: 'Home', path: '/', icon: Terminal },
    ...(token ? [
      { label: 'Dashboard', path: '/dashboard', icon: Key },
      { label: 'Playground', path: '/playground', icon: Play }
    ] : []),
    { label: 'API Reference', path: '/docs', icon: BookOpen }
  ]

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-brand-border bg-[#030712]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-glow group">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-glow text-white group-hover:scale-105 transition-transform duration-300">
                <Terminal size={20} />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                SearchMind <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-indigo-500/20 text-indigo-400 bg-indigo-500/5">API</span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPath === item.path
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                      }`}
                    >
                      <Icon size={14} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* User Section / Actions */}
          <div className="flex items-center gap-4">
            {token ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end text-xs">
                  <span className="font-medium text-gray-300">{user?.email}</span>
                  <span className="text-indigo-400 capitalize font-semibold">{user?.plan} plan</span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-brand-border text-gray-300 rounded-lg transition-all"
                >
                  <LogOut size={12} />
                  Logout
                </button>
              </div>
            ) : (
              <a
                href="#login-section"
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-glow"
              >
                Get API Key
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav indicator */}
      <div className="md:hidden flex justify-around py-2 border-t border-brand-border/40 bg-brand-dark/20 text-xs text-gray-400">
        {navItems.map((item) => {
          const isActive = currentPath === item.path
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 transition-all ${
                isActive ? 'text-indigo-400 font-semibold' : 'hover:text-gray-300'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
