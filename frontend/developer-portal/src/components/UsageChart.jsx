import React from 'react'
import { BarChart, Search, Sparkles, FileText, Compass, AlertCircle } from 'lucide-react'

export default function UsageChart({ usage }) {
  const endpoints = [
    { 
      name: 'Search', 
      count: usage?.search_count || 0, 
      color: '#3b9eff', 
      glowClass: 'hover:shadow-[0_0_20px_rgba(59,158,255,0.15)]',
      borderColor: 'hover:border-[#3b9eff]/30',
      icon: Search,
      desc: 'Real-time web search and index retrieval.'
    },
    { 
      name: 'Extract', 
      count: usage?.extract_count || 0, 
      color: '#ff801f', 
      glowClass: 'hover:shadow-[0_0_20px_rgba(255,128,31,0.15)]',
      borderColor: 'hover:border-[#ff801f]/30',
      icon: FileText,
      desc: 'Clean, LLM-ready markdown page extraction.'
    },
    { 
      name: 'Crawl', 
      count: usage?.crawl_count || 0, 
      color: '#ffc53d', 
      glowClass: 'hover:shadow-[0_0_20px_rgba(255,197,61,0.15)]',
      borderColor: 'hover:border-[#ffc53d]/30',
      icon: Compass,
      desc: 'Headless rendering and multi-page crawl loops.'
    },
    { 
      name: 'Research', 
      count: usage?.research_count || 0, 
      color: '#10b981', 
      glowClass: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      borderColor: 'hover:border-[#10b981]/30',
      icon: Sparkles,
      desc: 'Parallelized multi-query deep search loops.'
    }
  ]

  const maxCount = Math.max(...endpoints.map(e => e.count), 1)

  return (
    <div className="bg-cream-soft/40 backdrop-blur-md border border-hairline rounded-lg p-6 space-y-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-20%] left-[-20%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[80px] pointer-events-none"></div>

      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cream border border-beige-deep text-primary shadow-inner">
            <BarChart size={15} />
          </div>
          <div>
            <h3 className="font-semibold text-ink text-base font-sans">Endpoint Usage Breakdown</h3>
            <p className="text-[10px] text-slate font-mono mt-0.5 uppercase tracking-wide">Real-time API telemetry</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {endpoints.map((ep) => {
          const Icon = ep.icon
          const percent = (ep.count / maxCount) * 100
          
          return (
            <div 
              key={ep.name} 
              className={`bg-cream border border-hairline p-5 rounded-xl flex flex-col justify-between h-44 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${ep.borderColor} ${ep.glowClass}`}
            >
              {/* Subtle top edge color band */}
              <div 
                className="absolute top-0 left-0 right-0 h-[3px] transition-all duration-300"
                style={{ backgroundColor: ep.color }}
              ></div>

              <div className="flex justify-between items-start pt-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold text-ink uppercase tracking-wider">{ep.name}</span>
                  <p className="text-[10px] text-slate font-sans leading-tight max-w-[150px]">{ep.desc}</p>
                </div>
                <div 
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: `${ep.color}15`, color: ep.color }}
                >
                  <Icon size={14} className="group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-3xl font-extrabold text-ink tracking-tight">{ep.count.toLocaleString()}</span>
                  <span className="text-[9px] text-slate uppercase font-bold tracking-wider">calls</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden border border-hairline">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      backgroundColor: ep.color,
                      width: `${percent}%`,
                      boxShadow: `0 0 8px ${ep.color}`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {usage?.total_tokens > 0 && (
        <div className="flex items-start gap-3.5 p-4.5 bg-cream/60 backdrop-blur-sm border border-hairline rounded-xl font-sans text-xs text-slate">
          <AlertCircle size={15} className="text-primary flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            LLM Processing: You have consumed <strong className="text-primary font-bold">{usage.total_tokens.toLocaleString()}</strong> tokens in synthesis generation for search summaries and parallelized research tasks.
          </div>
        </div>
      )}
    </div>
  )
}
