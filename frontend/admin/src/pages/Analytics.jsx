import React from 'react'
import { BarChart3, TrendingUp, Cpu, Server, Activity, ArrowUpRight } from 'lucide-react'

export default function AnalyticsPage() {
  const metrics = [
    { title: 'Total API Volume', value: '154,230', change: '+12.4%', status: 'up', icon: TrendingUp, color: '#8b5cf6' },
    { title: 'Cache Hit Ratio', value: '42.5%', change: '+3.1%', status: 'up', icon: Server, color: '#ec4899' },
    { title: 'Average Latency', value: '340 ms', change: '-8.2%', status: 'down', icon: Activity, color: '#06b6d4' },
    { title: 'Error Rate (5xx)', value: '0.04%', change: '-0.02%', status: 'down', icon: Cpu, color: '#f43f5e' }
  ]

  // Mock charts coordinates
  const queryPoints = [30, 45, 38, 55, 62, 78, 70, 85, 92, 88, 105, 120]
  const latencyPoints = [420, 390, 410, 360, 350, 340, 335, 338, 350, 345, 340, 330]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="text-violet-400" />
          Platform Analytics
        </h1>
        <p className="text-sm text-gray-400">Monitor platform traffic, error logs, and system level token throughput.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.title} className="glass-panel p-6 rounded-xl border border-brand-border flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{m.title}</span>
                <p className="text-2xl font-extrabold text-white">{m.value}</p>
                <div className="flex items-center gap-1 text-xs">
                  <span className={m.status === 'up' ? 'text-emerald-400' : 'text-emerald-400'}>{m.change}</span>
                  <span className="text-gray-500">vs last month</span>
                </div>
              </div>
              <div 
                className="p-3 rounded-full text-white"
                style={{ backgroundColor: `${m.color}15`, color: m.color }}
              >
                <Icon size={24} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request volume */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-6">
          <div className="flex justify-between items-center border-b border-brand-border/40 pb-4">
            <h3 className="font-bold text-gray-200 text-lg">Query Volume Trend (12h)</h3>
            <span className="text-xs text-gray-500">10k requests / division</span>
          </div>

          {/* Simple custom SVG sparkline chart */}
          <div className="h-64 w-full bg-black/20 rounded-xl relative border border-brand-border/30 overflow-hidden flex items-end p-2">
            <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="violetGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="25" x2="400" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              <line x1="0" y1="75" x2="400" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

              {/* Area path */}
              <path
                d={`M 0 100 L ${queryPoints.map((val, i) => `${(i / (queryPoints.length - 1)) * 400} ${100 - val * 0.7}`).join(' L ')} L 400 100 Z`}
                fill="url(#violetGlow)"
              />
              {/* Line path */}
              <path
                d={queryPoints.map((val, i) => `${i === 0 ? 'M' : 'L'} ${(i / (queryPoints.length - 1)) * 400} ${100 - val * 0.7}`).join(' ')}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Latency distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-6">
          <div className="flex justify-between items-center border-b border-brand-border/40 pb-4">
            <h3 className="font-bold text-gray-200 text-lg">Response Latency (12h)</h3>
            <span className="text-xs text-gray-500">Average: 340ms</span>
          </div>

          <div className="h-64 w-full bg-black/20 rounded-xl relative border border-brand-border/30 overflow-hidden flex items-end p-2">
            <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="25" x2="400" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              <line x1="0" y1="75" x2="400" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

              <path
                d={`M 0 100 L ${latencyPoints.map((val, i) => `${(i / (latencyPoints.length - 1)) * 400} ${100 - (val / 500) * 80}`).join(' L ')} L 400 100 Z`}
                fill="url(#cyanGlow)"
              />
              <path
                d={latencyPoints.map((val, i) => `${i === 0 ? 'M' : 'L'} ${(i / (latencyPoints.length - 1)) * 400} ${100 - (val / 500) * 80}`).join(' ')}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
