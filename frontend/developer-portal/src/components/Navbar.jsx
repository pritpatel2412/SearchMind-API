import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Terminal, Key, Play, BookOpen, LogOut, CreditCard, Compass } from 'lucide-react'

export default function Navbar({ token, user, onLogout }) {
  const location = useLocation()
  const currentPath = location.pathname

  const navItems = [
    { label: 'Home', path: '/', icon: Terminal },
    ...(token ? [
      { label: 'Dashboard', path: '/dashboard', icon: Key },
      { label: 'Playground', path: '/playground', icon: Play }
    ] : []),
    { label: 'Pricing', path: '/pricing', icon: CreditCard },
    { label: 'API Reference', path: '/docs', icon: BookOpen },
    { label: 'Roadmap', path: '/roadmap', icon: Compass }
  ]

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-hairline bg-canvas/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">
          
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group font-sans">
              <img src="/logo-new.png" alt="SearchMind Logo" className="h-10 w-auto group-hover:scale-105 transition-transform duration-300" />
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-body-sm-medium transition-all ${
                        isActive
                          ? 'bg-cream text-ink border border-beige-deep shadow-sm font-semibold'
                          : 'text-slate hover:text-ink hover:bg-cream/40'
                      }`}
                    >
                      <Icon size={12} className={isActive ? 'text-primary' : 'text-steel'} />
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
                  <span className="text-micro text-ink font-semibold">{user?.email}</span>
                  <span className="text-micro text-primary font-bold capitalize">{user?.plan} plan</span>
                </div>
                <button
                  onClick={onLogout}
                  className="button-ghost text-xs px-2.5 h-[30px] border border-hairline-strong bg-cream/30 text-ink hover:bg-cream/50"
                >
                  <LogOut size={11} className="mr-1 text-primary" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/auth?mode=register"
                className="button-primary text-xs px-5 h-[38px] rounded-md font-semibold font-sans"
              >
                Start Free
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* Mobile nav indicator */}
      <div className="md:hidden flex justify-around py-2 border-t border-hairline bg-cream/30 text-[9px] font-mono text-slate">
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
              <item.icon size={13} className={isActive ? 'text-primary' : 'text-steel'} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
