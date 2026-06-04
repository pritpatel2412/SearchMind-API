import React from 'react'
import { BarChart, Search, Sparkles, FileText, Compass, AlertCircle } from 'lucide-react'

export default function UsageChart({ usage }) {
  const endpoints = [
    { name: 'Search', count: usage?.search_count || 0, color: '#3b9eff', icon: Search },
    { name: 'Extract', count: usage?.extract_count || 0, color: '#ff801f', icon: FileText },
    { name: 'Crawl', count: usage?.crawl_count || 0, color: '#ffc53d', icon: Compass },
    { name: 'Research', count: usage?.research_count || 0, color: '#11ff99', icon: Sparkles }
  ]

  const maxCount = Math.max(...endpoints.map(e => e.count), 1)

  return (
    <div className="bg-surface-card border border-hairline-strong p-6 rounded-lg space-y-6">
      <div className="flex items-center gap-2 border-b border-hairline pb-4">
        <div className="p-1.5 rounded bg-surface-deep border border-hairline text-accent-blue">
          <BarChart size={14} />
        </div>
        <h3 className="font-semibold text-ink text-base font-display">Endpoint Usage Breakdown</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {endpoints.map((ep) => {
          const Icon = ep.icon
          const percent = (ep.count / maxCount) * 100
          
          return (
            <div 
              key={ep.name} 
              className="bg-surface-deep border border-hairline-strong p-4 rounded-lg flex flex-col justify-between h-36 relative overflow-hidden group hover:brightness-110 transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold text-mute uppercase">{ep.name}</span>
                <div 
                  className="p-1.5 rounded text-white"
                  style={{ backgroundColor: `${ep.color}15`, color: ep.color }}
                >
                  <Icon size={12} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-extrabold text-ink">{ep.count.toLocaleString()}</span>
                  <span className="text-[9px] text-mute uppercase font-semibold">reqs</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-surface-card rounded-full overflow-hidden border border-hairline">
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
        <div className="flex items-center gap-3 p-4 bg-surface-deep border border-hairline-strong rounded-lg font-mono text-xs text-mute">
          <AlertCircle size={14} className="text-accent-blue flex-shrink-0" />
          <div>
            You have consumed <strong className="text-accent-blue font-bold">{usage.total_tokens.toLocaleString()}</strong> tokens in LLM generation for search summaries and synthesized research tasks.
          </div>
        </div>
      )}
    </div>
  )
}
