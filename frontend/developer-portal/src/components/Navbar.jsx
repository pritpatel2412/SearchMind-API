import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Terminal, Key, Play, BookOpen, LogOut } from 'lucide-react'

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
    <nav className="sticky top-0 z-40 w-full border-b border-hairline bg-canvas/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">
          
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-1.5 rounded bg-ink text-canvas group-hover:scale-105 transition-transform duration-300">
                <Terminal size={14} />
              </div>
              <span className="font-extrabold text-sm font-display tracking-tight text-ink flex items-center gap-1.5">
                SearchMind
                <span className="text-[9px] font-mono tracking-widest text-mute border border-hairline px-1 rounded bg-surface-card uppercase">
                  API
                </span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPath === item.path
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-all ${
                        isActive
                          ? 'bg-surface-elevated text-ink border border-hairline-strong'
                          : 'text-charcoal hover:text-ink hover:bg-surface-card'
                      }`}
                    >
                      <Icon size={12} className={isActive ? 'text-accent-blue' : 'text-mute'} />
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
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-[10px] font-mono text-ink font-medium">{user?.email}</span>
                  <span className="text-[9px] font-mono text-accent-blue font-bold capitalize">{user?.plan} plan</span>
                </div>
                <button
                  onClick={onLogout}
                  className="button-ghost text-xs px-2.5 h-[30px]"
                >
                  <LogOut size={11} className="mr-1 text-accent-red" />
                  Logout
                </button>
              </div>
            ) : (
              <a
                href="#auth-section"
                className="button-primary text-xs px-4 h-[32px] rounded-md font-semibold"
              >
                Start Free
              </a>
            )}
          </div>

        </div>
      </div>

      {/* Mobile nav indicator */}
      <div className="md:hidden flex justify-around py-2 border-t border-hairline bg-surface-card text-[9px] font-mono text-mute">
        {navItems.map((item) => {
          const isActive = currentPath === item.path
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 transition-all ${
                isActive ? 'text-ink font-semibold' : 'hover:text-ink'
              }`}
            >
              <item.icon size={13} className={isActive ? 'text-accent-blue' : 'text-mute'} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
