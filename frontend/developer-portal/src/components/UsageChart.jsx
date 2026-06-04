import React from 'react'
import { BarChart, Search, Sparkles, FileText, Compass, AlertCircle } from 'lucide-react'

export default function UsageChart({ usage }) {
  const endpoints = [
    { name: 'Search', count: usage?.search_count || 0, color: '#6366f1', icon: Search },
    { name: 'Extract', count: usage?.extract_count || 0, color: '#a855f7', icon: FileText },
    { name: 'Crawl', count: usage?.crawl_count || 0, color: '#06b6d4', icon: Compass },
    { name: 'Research', count: usage?.research_count || 0, color: '#f43f5e', icon: Sparkles }
  ]

  const maxCount = Math.max(...endpoints.map(e => e.count), 1)

  return (
    <div className="glass-panel p-6 rounded-xl space-y-6">
      <div className="flex items-center gap-2 border-b border-brand-border/40 pb-4">
        <div className="p-1.5 rounded bg-purple-500/10 text-purple-400">
          <BarChart size={16} />
        </div>
        <h3 className="font-bold text-gray-200 text-lg">Endpoint Usage Breakdown</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {endpoints.map((ep) => {
          const Icon = ep.icon
          const percent = (ep.count / maxCount) * 100
          
          return (
            <div 
              key={ep.name} 
              className="bg-black/30 p-4 rounded-xl border border-brand-border/40 flex flex-col justify-between h-36 relative overflow-hidden group hover:border-indigo-500/10 transition-all duration-300"
            >
              {/* Subtle background glow on hover */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at center, ${ep.color} 0%, transparent 70%)`
                }}
              ></div>

              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-gray-400">{ep.name}</span>
                <div 
                  className="p-1.5 rounded-lg text-white"
                  style={{ backgroundColor: `${ep.color}15`, color: ep.color }}
                >
                  <Icon size={14} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-white">{ep.count.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">reqs</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-800/80 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      backgroundColor: ep.color,
                      width: `${percent}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {usage?.total_tokens > 0 && (
        <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
          <AlertCircle size={16} className="text-indigo-400 flex-shrink-0" />
          <div className="text-xs text-gray-400">
            You have consumed <strong className="text-indigo-300 font-semibold">{usage.total_tokens.toLocaleString()}</strong> tokens in LLM generation for search summaries and synthesized research tasks.
          </div>
        </div>
      )}
    </div>
  )
}
