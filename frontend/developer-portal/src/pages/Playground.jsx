import React, { useState } from 'react'
import { useLiveSearch } from '../hooks/useLiveSearch'
import { describeEvent } from '../utils/describeEvent'
import { 
  Play, Sparkles, AlertCircle, Clock, Database, ExternalLink, Copy, Check, 
  Download, Terminal, Search, Globe, Calendar, BookOpen, GitBranch, Sliders, Settings2, Cpu, Layers, X, Lock
} from 'lucide-react'

// Theme config for endpoints
function FeedRow({ evt, index }) {
  const desc = describeEvent(evt);
  if (!desc) return null;

  return (
    <div className={`feed-row feed-row--${desc.tone}`}>
      <span className="feed-index">{String(index + 1).padStart(2, '0')}</span>
      <span className="feed-icon">{desc.icon}</span>
      <span className="feed-text">{desc.text}</span>
      <details className="feed-raw">
        <summary>raw</summary>
        <pre>{JSON.stringify(evt, null, 2)}</pre>
      </details>
    </div>
  );
}

const configs = {
  '/v1/search': {
    name: 'AI Search',
    colorClass: 'text-orange-400',
    borderClass: 'border-orange-500/30',
    activeBorder: 'border-orange-500/60',
    bgClass: 'bg-orange-500/5',
    glowClass: 'shadow-[0_0_20px_rgba(241,90,36,0.08)]',
    buttonBg: 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700',
    accentColor: '#F15A24',
    desc: 'Web search + answers'
  },
  '/v1/extract': {
    name: 'URL Extract',
    colorClass: 'text-[#3b9eff]',
    borderClass: 'border-[#3b9eff]/30',
    activeBorder: 'border-[#3b9eff]/60',
    bgClass: 'bg-[#3b9eff]/5',
    glowClass: 'shadow-[0_0_20px_rgba(59,158,255,0.08)]',
    buttonBg: 'bg-gradient-to-r from-[#3b9eff] to-[#1d4ed8] hover:from-[#2563eb] hover:to-[#1e40af]',
    accentColor: '#3B9EFF',
    desc: 'Markdown content strip'
  },
  '/v1/research': {
    name: 'Deep Research',
    colorClass: 'text-[#a78bfa]',
    borderClass: 'border-[#a78bfa]/30',
    activeBorder: 'border-[#a78bfa]/60',
    bgClass: 'bg-[#a78bfa]/5',
    glowClass: 'shadow-[0_0_20px_rgba(167,139,250,0.08)]',
    buttonBg: 'bg-gradient-to-r from-[#a78bfa] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#5b21b6]',
    accentColor: '#A78BFA',
    desc: 'Multi-query agent loops'
  },
  '/v1/crawl': {
    name: 'Domain Crawl',
    colorClass: 'text-[#10b981]',
    borderClass: 'border-[#10b981]/30',
    activeBorder: 'border-[#10b981]/60',
    bgClass: 'bg-[#10b981]/5',
    glowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.08)]',
    buttonBg: 'bg-gradient-to-r from-[#10b981] to-[#047857] hover:from-[#059669] hover:to-[#065f46]',
    accentColor: '#10B981',
    desc: 'Recursive site indexer'
  }
}

// Custom Sliding Toggle Switch Component
const Toggle = ({ checked, onChange, label, description, icon: Icon }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs transition-all duration-300 w-full text-left cursor-pointer ${
      checked
        ? 'bg-primary/5 border-primary/20 text-ink shadow-[0_0_12px_rgba(241,90,36,0.04)]'
        : 'bg-surface-code/40 border-hairline text-slate hover:border-hairline-strong hover:bg-surface-code/60'
    }`}
  >
    <div className="flex items-center gap-3">
      {Icon && <Icon size={14} className={checked ? 'text-primary' : 'text-slate'} />}
      <div className="space-y-0.5">
        <span className="font-mono font-bold tracking-wide block">{label}</span>
        {description && <span className="text-[10px] text-steel block font-sans font-medium">{description}</span>}
      </div>
    </div>
    <div className={`w-8 h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 ${checked ? 'bg-primary' : 'bg-hairline-strong'}`}>
      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-md ${checked ? 'translate-x-3' : 'translate-x-0'}`}></div>
    </div>
  </button>
)

export default function Playground({ token, user, setUser, apiKey }) {
  const [endpoint, setEndpoint] = useState('/v1/search')
  
  // Search parameters
  const [query, setQuery] = useState('')
  const [searchDepth, setSearchDepth] = useState('basic')
  const [topic, setTopic] = useState('general')
  const [includeAnswer, setIncludeAnswer] = useState(true)
  const [numResults, setNumResults] = useState(5)
  const [timeRange, setTimeRange] = useState('')
  const [includeRawContent, setIncludeRawContent] = useState(false)
  
  // Extract parameters
  const [extractUrls, setExtractUrls] = useState('')
  const [useJsRendering, setUseJsRendering] = useState(false)
  const [maxContentLength, setMaxContentLength] = useState(5000)

  // Research parameters
  const [researchQuery, setResearchQuery] = useState('')
  const [maxSources, setMaxSources] = useState(8)

  // Crawl parameters
  const [crawlUrl, setCrawlUrl] = useState('')
  const [maxDepth, setMaxDepth] = useState(1)
  const [maxPages, setMaxPages] = useState(10)

  // System states
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
  const { loading, error, results, events, screenshots, latency, runPipeline, cancel, reset } = useLiveSearch(apiUrl, endpoint, token, apiKey)

  const [copiedResponse, setCopiedResponse] = useState(false)
  const [responseTab, setResponseTab] = useState('json')
  const [showLogs, setShowLogs] = useState(true)
  const [upgradingPlan, setUpgradingPlan] = useState(false)
  const [upgradeMsg, setUpgradeMsg] = useState('')

  const activeConf = configs[endpoint]
  const userPlan = (user?.plan || 'free').toLowerCase()

  // Authorization checks
  const isAuthorized = (targetEndpoint = endpoint) => {
    if (targetEndpoint === '/v1/search') return true
    if (targetEndpoint === '/v1/extract' || targetEndpoint === '/v1/crawl') {
      return userPlan === 'pro' || userPlan === 'enterprise'
    }
    if (targetEndpoint === '/v1/research') {
      return userPlan === 'enterprise'
    }
    return true
  }

  const getRequiredPlan = () => {
    if (endpoint === '/v1/extract' || endpoint === '/v1/crawl') return 'Developer Pro'
    if (endpoint === '/v1/research') return 'Scale Enterprise'
    return 'Free Sandbox'
  }

  const handleInlineUpgrade = async (targetPlan) => {
    if (!token || !user) return
    setUpgradingPlan(true)
    setUpgradeMsg('')
    const planKey = targetPlan === 'Developer Pro' ? 'pro' : 'enterprise'
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
      const response = await fetch(`${apiUrl}/admin/users/${user.id}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: planKey })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Upgrade failed')
      }
      
      const updatedUser = { ...user, plan: planKey }
      setUser(updatedUser)
      setUpgradeMsg(`Account upgraded to ${targetPlan} tier successfully!`)
    } catch (err) {
      setUpgradeMsg(`Upgrade failed: ${err.message}`)
    } finally {
      setUpgradingPlan(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!isAuthorized()) return
    
    let payload = {}

    if (endpoint === '/v1/search') {
      if (!query.trim()) return
      payload = {
        query: query.trim(),
        num_results: parseInt(numResults),
        search_depth: searchDepth,
        include_answer: includeAnswer,
        include_raw_content: includeRawContent,
        topic: topic,
        max_content_length: 2000
      }
      if (timeRange) payload.time_range = timeRange
    } else if (endpoint === '/v1/extract') {
      if (!extractUrls.trim()) return
      const urlsArray = extractUrls.split('\n').map(u => u.trim()).filter(Boolean)
      payload = {
        urls: urlsArray,
        use_js_rendering: useJsRendering,
        max_content_length: parseInt(maxContentLength)
      }
    } else if (endpoint === '/v1/research') {
      if (!researchQuery.trim()) return
      payload = {
        query: researchQuery.trim(),
        max_sources: parseInt(maxSources),
        search_depth: 'advanced',
        include_summary: true
      }
    } else if (endpoint === '/v1/crawl') {
      if (!crawlUrl.trim()) return
      payload = {
        url: crawlUrl.trim(),
        max_depth: parseInt(maxDepth),
        max_pages: parseInt(maxPages)
      }
    }

    await runPipeline(payload, endpoint === '/v1/crawl')
  }

  const handleCopyResponse = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedResponse(true)
    setTimeout(() => setCopiedResponse(false), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 space-y-10 text-left relative overflow-hidden">
      
      {/* Background ambient lighting glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-blue/3 blur-[120px] pointer-events-none z-0"></div>

      {/* Header */}
      <div className="border-b border-hairline pb-6 z-10 relative flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-heading-1 text-ink font-light">Search Playground</h1>
          <p className="text-caption text-slate">Configure endpoint parameters, execute live requests, and review outputs in real-time.</p>
        </div>
        <div className="text-right font-mono text-[11px] text-slate shrink-0 hidden sm:block">
          <span>Active Plan: </span>
          <span className="text-primary font-bold capitalize">{userPlan}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* LEFT PANEL — Request Builder */}
        <div className="lg:col-span-5 bg-[#0e0e0d]/70 backdrop-blur-xl border border-hairline p-6 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
          
          {/* Subtle accent glow top card */}
          <div className="absolute top-0 left-0 right-0 h-[2px] transition-colors duration-500" style={{ backgroundColor: activeConf.accentColor }} />
          
          {/* Custom Grid Endpoint Tabs */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono text-slate uppercase tracking-wider">Target API Endpoint</span>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { path: '/v1/search', label: 'AI Search', icon: Search, desc: configs['/v1/search'].desc },
                { path: '/v1/extract', label: 'URL Extract', icon: Settings2, desc: configs['/v1/extract'].desc },
                { path: '/v1/research', label: 'Deep Research', icon: Cpu, desc: configs['/v1/research'].desc },
                { path: '/v1/crawl', label: 'Domain Crawl', icon: GitBranch, desc: configs['/v1/crawl'].desc }
              ].map((item) => {
                const Icon = item.icon
                const isActive = endpoint === item.path
                const itemConf = configs[item.path]
                const locked = !isAuthorized(item.path)
                return (
                  <button
                    key={item.path}
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      setEndpoint(item.path)
                      reset()
                      setUpgradeMsg('')
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-300 relative group flex flex-col justify-between h-22 ${
                      locked 
                        ? 'opacity-50 cursor-not-allowed bg-surface-code/20 border-hairline' 
                        : isActive 
                          ? `${itemConf.bgClass} ${itemConf.activeBorder} ${itemConf.glowClass} cursor-pointer` 
                          : 'bg-surface-code/30 border-hairline hover:border-hairline-strong hover:bg-surface-code/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-[#0c0c0b] border border-hairline-strong ' + itemConf.colorClass : 'bg-[#0c0c0b]/40 border border-hairline text-slate group-hover:text-ink'}`}>
                        <Icon size={13} />
                      </span>
                      {locked ? (
                        <span className="text-slate/60"><Lock size={12} /></span>
                      ) : isActive && (
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: itemConf.accentColor }}></span>
                      )}
                    </div>
                    <div>
                      <span className={`block text-[11px] font-bold font-sans transition-colors ${isActive ? 'text-ink' : 'text-slate group-hover:text-ink'}`}>
                        {item.label}
                      </span>
                      <span className="block text-[9px] text-steel font-medium truncate mt-0.5 max-w-[125px]">
                        {item.desc}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSearch} className="space-y-5 border-t border-hairline pt-5 text-left">
            
            {/* PLAN LIMIT CHECKS WARNINGS */}
            {!isAuthorized() && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                <div className="flex gap-2 text-primary text-xs font-mono items-center font-bold">
                  <AlertCircle size={14} />
                  <span>TIER RESTRICTION</span>
                </div>
                <p className="text-[11px] text-slate font-sans leading-relaxed">
                  The <strong>{activeConf.name}</strong> endpoint requires a <strong>{getRequiredPlan()}</strong> plan. Your current plan is <strong>{userPlan.toUpperCase()}</strong>.
                </p>
                <div className="bg-[#121210] border border-hairline p-4 rounded-xl text-slate font-mono text-[10.5px] space-y-2 leading-relaxed">
                  <p>
                    SearchMind is currently in beta and under active development. We advise against making any payments until the stable version is officially released.
                  </p>
                  <p>
                    Interested in testing features, sharing feedback, or learning more? Contact us at{' '}
                    <a href="mailto:try.prit24@gmail.com" className="text-primary hover:underline">
                      try.prit24@gmail.com
                    </a>.
                  </p>
                  <p>
                    Your feedback helps shape the future of SearchMind.
                  </p>
                </div>
              </div>
            )}

            {/* SEARCH FORMS */}
            {endpoint === '/v1/search' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate uppercase tracking-wider">Search Query</label>
                  <div className="relative flex items-stretch">
                    <span className="absolute left-3.5 top-3.5 text-slate pointer-events-none">
                      <Search size={13} />
                    </span>
                    <textarea
                      required
                      rows={2}
                      disabled={!isAuthorized()}
                      placeholder="Enter keywords, queries, or questions..."
                      className="glass-input !pl-10 text-xs resize-none border border-hairline-strong bg-[#121210] focus:border-primary w-full h-auto min-h-[64px] focus:ring-1 focus:ring-primary/40 transition-all rounded-lg"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      "Latest breakthroughs in Quantum Computing",
                      "Current interest rates and economic outlook",
                      "How to optimize React performance"
                    ].map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={!isAuthorized()}
                        onClick={() => setQuery(q)}
                        className="text-[10px] bg-surface-code/50 border border-hairline hover:border-hairline-strong text-slate hover:text-ink px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate uppercase tracking-wider">Search Depth</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                        <Sliders size={13} />
                      </span>
                      <select 
                        disabled={!isAuthorized()}
                        className="glass-input !pl-10 text-xs cursor-pointer font-sans border border-hairline-strong bg-[#121210] focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all appearance-none rounded-lg" 
                        value={searchDepth} 
                        onChange={(e) => setSearchDepth(e.target.value)}
                      >
                        <option value="basic">Basic (Fast)</option>
                        <option value="advanced">Advanced (Deep)</option>
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate uppercase tracking-wider">Results (1-20)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                        <Database size={13} />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        disabled={!isAuthorized()}
                        className="glass-input !pl-10 text-xs font-sans border border-hairline-strong bg-[#121210] focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all rounded-lg"
                        value={numResults}
                        onChange={(e) => setNumResults(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate uppercase tracking-wider">Topic Type</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                        <Globe size={13} />
                      </span>
                      <select 
                        disabled={!isAuthorized()}
                        className="glass-input !pl-10 text-xs cursor-pointer font-sans border border-hairline-strong bg-[#121210] focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all appearance-none rounded-lg" 
                        value={topic} 
                        onChange={(e) => setTopic(e.target.value)}
                      >
                        <option value="general">General</option>
                        <option value="news">News</option>
                        <option value="finance">Finance</option>
                        <option value="science">Science</option>
                        <option value="technology">Technology</option>
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate uppercase tracking-wider">Time Limit</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                        <Calendar size={13} />
                      </span>
                      <select 
                        disabled={!isAuthorized()}
                        className="glass-input !pl-10 text-xs cursor-pointer font-sans border border-hairline-strong bg-[#121210] focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all appearance-none rounded-lg" 
                        value={timeRange} 
                        onChange={(e) => setTimeRange(e.target.value)}
                      >
                        <option value="">Any Time</option>
                        <option value="pd">Past Day (pd)</option>
                        <option value="pw">Past Week (pw)</option>
                        <option value="pm">Past Month (pm)</option>
                        <option value="py">Past Year (py)</option>
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 py-2 border-t border-hairline mt-2">
                  <Toggle
                    checked={includeAnswer}
                    onChange={setIncludeAnswer}
                    label="SYNTHESIZE ANSWER"
                    description="Run LLM to summarize and construct a unified answer text"
                    icon={Sparkles}
                  />
                  <Toggle
                    checked={includeRawContent}
                    onChange={setIncludeRawContent}
                    label="INCLUDE CITATIONS"
                    description="Return raw content logs and citation metadata in the payload"
                    icon={BookOpen}
                  />
                </div>
              </div>
            )}

            {/* EXTRACT FORMS */}
            {endpoint === '/v1/extract' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate uppercase tracking-wider">URLs (one per line, max 10)</label>
                  <div className="relative flex items-stretch">
                    <span className="absolute left-3.5 top-3.5 text-slate pointer-events-none">
                      <Globe size={13} />
                    </span>
                    <textarea
                      required
                      rows={4}
                      disabled={!isAuthorized()}
                      placeholder="https://example.com/article&#10;https://another-url.org/docs"
                      className="glass-input !pl-10 text-xs resize-none border border-hairline-strong bg-[#121210] focus:border-primary w-full h-auto min-h-[96px] focus:ring-1 focus:ring-primary/40 transition-all rounded-lg"
                      value={extractUrls}
                      onChange={(e) => setExtractUrls(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate uppercase tracking-wider">Max Content Length (chars)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                      <Settings2 size={13} />
                    </span>
                    <input
                      type="number"
                      disabled={!isAuthorized()}
                      className="glass-input !pl-10 text-xs border border-hairline-strong bg-[#121210] focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all rounded-lg"
                      value={maxContentLength}
                      onChange={(e) => setMaxContentLength(e.target.value)}
                    />
                  </div>
                </div>

                <Toggle
                  checked={useJsRendering}
                  onChange={setUseJsRendering}
                  label="DYNAMIC JS RENDERING"
                  description="Use Playwright to execute client-side scripts"
                  icon={Cpu}
                />
              </div>
            )}

            {/* RESEARCH FORMS */}
            {endpoint === '/v1/research' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate uppercase tracking-wider">Research Topic</label>
                  <div className="relative flex items-stretch">
                    <span className="absolute left-3.5 top-3.5 text-slate pointer-events-none">
                      <Search size={13} />
                    </span>
                    <textarea
                      required
                      rows={3}
                      disabled={!isAuthorized()}
                      placeholder="Provide a comprehensive subject query to research..."
                      className="glass-input !pl-10 text-xs resize-none border border-hairline-strong bg-[#121210] focus:border-primary w-full h-auto min-h-[80px] focus:ring-1 focus:ring-primary/40 transition-all rounded-lg"
                      value={researchQuery}
                      onChange={(e) => setResearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      "Comprehensive analysis of autonomous AI agents",
                      "Market research on the electric vehicle industry",
                      "Impact of new SEC climate disclosure rules"
                    ].map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={!isAuthorized()}
                        onClick={() => setResearchQuery(q)}
                        className="text-[10px] bg-surface-code/50 border border-hairline hover:border-hairline-strong text-slate hover:text-ink px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate uppercase tracking-wider">Max Reference Sources (1-15)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                      <BookOpen size={13} />
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      disabled={!isAuthorized()}
                      className="glass-input !pl-10 text-xs font-mono border border-hairline-strong bg-[#121210] focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all rounded-lg"
                      value={maxSources}
                      onChange={(e) => setMaxSources(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CRAWL FORMS */}
            {endpoint === '/v1/crawl' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate uppercase tracking-wider">Crawl Seed Domain URL</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                      <Globe size={13} />
                    </span>
                    <input
                      type="url"
                      required
                      disabled={!isAuthorized()}
                      placeholder="https://docs.searchmind.dev"
                      className="glass-input !pl-10 text-xs border border-hairline-strong bg-[#121210] focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all rounded-lg"
                      value={crawlUrl}
                      onChange={(e) => setCrawlUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate uppercase tracking-wider">Max Depth (1-5)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                        <GitBranch size={13} />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        disabled={!isAuthorized()}
                        className="glass-input !pl-10 text-xs font-mono border border-hairline-strong bg-[#121210] focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all rounded-lg"
                        value={maxDepth}
                        onChange={(e) => setMaxDepth(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate uppercase tracking-wider">Max Pages (1-100)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                        <Database size={13} />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        disabled={!isAuthorized()}
                        className="glass-input !pl-10 text-xs font-mono border border-hairline-strong bg-[#121210] focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all rounded-lg"
                        value={maxPages}
                        onChange={(e) => setMaxPages(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isAuthorized()}
              className={`w-full mt-4 font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-white px-5 py-3 rounded-xl border-0 text-sm h-[46px] ${
                activeConf.buttonBg
              } ${
                (loading || !isAuthorized()) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] hover:shadow-lg'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" className="text-white" />
                  <span>Run Query</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT PANEL — Response Viewer */}
        <div className="lg:col-span-7 space-y-4 text-left">
          
          {/* Diagnostic status line */}
          <div className="bg-[#0e0e0d]/70 backdrop-blur-xl border border-hairline px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${loading ? 'bg-[#3b9eff] animate-pulse' : error ? 'bg-accent-red' : results ? 'bg-accent-green' : 'bg-[#272725]'}`}></span>
                <span className="font-bold text-ink uppercase">
                  {loading ? 'PROCESSING' : error ? 'ERROR' : results ? '200 OK' : 'IDLE'}
                </span>
              </div>
              {results && (
                <>
                  <span className="text-beige-deep">|</span>
                  <span className="flex items-center gap-1 text-slate">
                    <Clock size={11} /> {latency}ms
                  </span>
                  <span className="text-beige-deep">|</span>
                  <span className="flex items-center gap-1 text-slate">
                    <Database size={11} fill="none" /> 
                    {results.cached ? 'CACHED' : 'LIVE FETCH'}
                  </span>
                </>
              )}
            </div>

            <div className="flex gap-2 items-center">
              <label className="flex items-center gap-1.5 cursor-pointer mr-2 pr-3 border-r border-hairline group">
                <input type="checkbox" className="w-3 h-3 rounded-sm bg-[#121210] border-hairline text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer" checked={showLogs} onChange={(e) => setShowLogs(e.target.checked)} />
                <span className="text-[10px] font-mono text-slate uppercase font-bold tracking-wider group-hover:text-ink transition-colors">Stream Logs</span>
              </label>
              <button
                disabled={!results}
                onClick={() => setResponseTab('json')}
                className={`text-[10px] font-mono px-3 py-1.5 rounded-lg transition-all border cursor-pointer ${
                  responseTab === 'json' ? 'bg-[#1e1e1a] text-primary border-hairline-strong font-bold' : 'text-slate border-transparent hover:text-ink disabled:opacity-40'
                }`}
              >
                JSON Payload
              </button>
              <button
                disabled={!results || endpoint === '/v1/crawl' && !results.results}
                onClick={() => setResponseTab('formatted')}
                className={`text-[10px] font-mono px-3 py-1.5 rounded-lg transition-all border cursor-pointer ${
                  responseTab === 'formatted' ? 'bg-[#1e1e1a] text-primary border-hairline-strong font-bold' : 'text-slate border-transparent hover:text-ink disabled:opacity-40'
                }`}
              >
                Formatted Cards
              </button>
            </div>
          </div>

          {/* Response Console - Main Output Box */}
          <div className="bg-[#0e0e0d]/50 backdrop-blur-xl border border-hairline rounded-2xl min-h-[450px] overflow-hidden flex flex-col justify-between shadow-2xl relative">
            
            {/* Live Event Stream or Loading State */}
            {!results && !error && (
              <div className="flex flex-col flex-grow bg-[#090908]/50 h-[500px]">
                {(events.length > 0 && showLogs) ? (
                  <div className="p-6 font-mono text-xs text-slate space-y-3 flex-grow overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 border-b border-hairline mb-4">
                      <div className="flex items-center gap-2 text-primary">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="font-bold uppercase tracking-wider">Live Pipeline Feed</span>
                      </div>
                      {loading && (
                        <button onClick={cancel} className="text-accent-red hover:bg-accent-red/10 px-3 py-1 rounded text-[10px] uppercase font-bold border border-accent-red/20 transition-colors cursor-pointer">
                          Cancel
                        </button>
                      )}
                    </div>
                    
                    {/* Event Feed */}
                    <div className="space-y-3">
                      {events.map((evt, idx) => (
                        <FeedRow key={idx} evt={evt} index={idx} />
                      ))}
                      
                      {loading && (
                        <div className="flex items-center gap-2.5 pt-4 opacity-70">
                          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                          <span className="text-steel italic">Awaiting events...</span>
                        </div>
                      )}
                    </div>

                    {/* Screenshot Filmstrip */}
                    {screenshots.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-hairline">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-steel mb-3 flex items-center gap-2">
                          <Globe size={12} /> Live Browser Captures
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                          {screenshots.map((s, idx) => (
                            <div key={idx} className="shrink-0 w-48 rounded-lg border border-hairline overflow-hidden bg-black snap-start group relative">
                              <img src={`data:image/jpeg;base64,${s.b64}`} alt="Screenshot" className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <span className="text-[9px] text-white truncate block">{s.url}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center text-center p-12 flex-grow gap-5">
                    <div className="relative">
                      <div className="w-10 h-10 border-2 border-primary/20 rounded-full"></div>
                      <div className="w-10 h-10 border-2 border-transparent border-t-primary border-r-primary rounded-full animate-spin absolute inset-0"></div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-mono text-xs text-primary uppercase font-bold tracking-wider animate-pulse">Executing Pipeline</h4>
                      <p className="text-xs text-steel max-w-xs leading-relaxed">Initializing agent pipeline...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-12 flex-grow gap-4">
                    <div className="p-4 rounded-full bg-[#181816] border border-hairline text-slate shadow-inner">
                      <Terminal size={24} />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-mono text-xs text-slate uppercase font-bold tracking-wider">Console Ready</h4>
                      <p className="text-xs text-steel max-w-xs leading-relaxed">Submit request parameters to trigger live API pipelines.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error output */}
            {error && !loading && (
              <div className="p-6 space-y-4 flex-grow bg-[#090908]/20">
                <div className="p-4 bg-accent-red/5 border border-accent-red/20 text-ink rounded-xl flex gap-3.5 items-start font-mono text-xs text-left shadow-sm">
                  <AlertCircle className="flex-shrink-0 mt-0.5 text-accent-red" size={14} />
                  <div className="space-y-1">
                    <h5 className="font-bold uppercase tracking-wider text-accent-red">Pipeline Exception Raised</h5>
                    <p className="text-slate whitespace-pre-wrap">{error}</p>
                  </div>
                </div>
              </div>
            )}



            {/* Success results viewer */}
            {results && !error && (
              <div className="p-6 overflow-y-auto flex-grow max-h-[520px] text-left">
                {responseTab === 'json' ? (
                  <pre className="text-xs font-mono text-accent-green leading-relaxed overflow-x-auto whitespace-pre-wrap select-all bg-[#0a0a09] p-4 rounded-xl border border-hairline">
                    <code>{JSON.stringify(results, null, 2)}</code>
                  </pre>
                ) : (
                  <div className="space-y-6">
                    
                    {/* Render AI Answer Synthesis */}
                    {(results.answer || results.summary) && (
                      <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 relative overflow-hidden space-y-2 shadow-sm">
                        <div className="flex items-center gap-1.5 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">
                          <Sparkles size={13} /> Synthesis Output
                        </div>
                        <p className="text-ink text-xs leading-relaxed font-sans font-medium">
                          {results.answer || results.summary}
                        </p>
                      </div>
                    )}

                    {/* CRAWL RESULTS */}
                    {endpoint === '/v1/crawl' && results.results && (
                      <div className="space-y-4">
                        <div className="bg-[#121210] border border-hairline p-4 rounded-xl flex items-center justify-between font-mono text-[11px] text-slate">
                          <div>Seed: <strong className="text-ink">{results.seed_url}</strong></div>
                          <div>Pages Crawled: <strong className="text-accent-green">{results.pages_crawled}</strong></div>
                        </div>

                        <div className="space-y-3">
                          <span className="block text-[10px] font-mono text-slate font-bold uppercase tracking-wider">
                            Crawled Nodes ({results.results.length})
                          </span>
                          
                          {results.results.map((r, i) => (
                            <div key={r.url + i} className="bg-surface-code/40 border border-hairline p-4 rounded-xl space-y-2 font-sans transition-all hover:border-hairline-strong">
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <span className="font-semibold text-xs text-ink block">
                                    {r.title || 'Untitled Node'}
                                  </span>
                                  <a 
                                    href={r.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="font-mono text-[10px] text-slate hover:text-[#3b9eff] transition-colors flex items-center gap-1 truncate max-w-sm sm:max-w-md"
                                  >
                                    {r.url}
                                    <ExternalLink size={9} className="opacity-60" />
                                  </a>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  <span className={`px-2 py-0.5 rounded-full border font-mono text-[9px] font-bold ${
                                    r.success 
                                      ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' 
                                      : 'bg-accent-red/10 border-accent-red/20 text-accent-red'
                                  }`}>
                                    {r.success ? '200 OK' : 'FAILED'}
                                  </span>
                                  {r.word_count !== null && (
                                    <span className="text-[9px] text-steel font-mono">
                                      {r.word_count} words
                                    </span>
                                  )}
                                </div>
                              </div>
                              {r.error && (
                                <p className="text-[10.5px] font-mono text-accent-red bg-accent-red/5 p-2 rounded border border-accent-red/10">
                                  {r.error}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EXTRACT RESULTS */}
                    {endpoint === '/v1/extract' && results.results && (
                      <div className="space-y-4">
                        <span className="block text-[10px] font-mono text-slate font-bold uppercase tracking-wider">
                          Extracted URL content nodes ({results.results.length})
                        </span>
                        
                        {results.results.map((r, i) => (
                          <div key={r.url + i} className="bg-surface-code/40 border border-hairline p-5 rounded-xl space-y-3 font-sans transition-all hover:border-hairline-strong">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <span className="font-semibold text-xs text-ink block">
                                  {r.title || 'Untitled Extracted Document'}
                                </span>
                                <a 
                                  href={r.url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="font-mono text-[10px] text-slate hover:text-[#3b9eff] transition-colors flex items-center gap-1 truncate max-w-sm sm:max-w-md"
                                >
                                  {r.url}
                                  <ExternalLink size={9} className="opacity-60" />
                                </a>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className={`px-2 py-0.5 rounded-full border font-mono text-[9px] font-bold ${
                                  r.success 
                                    ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' 
                                    : 'bg-accent-red/10 border-accent-red/20 text-accent-red'
                                  }`}>
                                  {r.success ? 'Success' : 'Failed'}
                                </span>
                                {r.success && (
                                  <span className="text-[9px] text-steel font-mono">
                                    {r.word_count} words
                                  </span>
                                )}
                              </div>
                            </div>

                            {r.success ? (
                              <p className="text-xs text-slate leading-relaxed bg-[#0c0c0b] p-3 rounded-lg border border-hairline font-sans select-all max-h-48 overflow-y-auto whitespace-pre-wrap">
                                {r.content}
                              </p>
                            ) : (
                              <p className="text-xs font-mono text-accent-red bg-accent-red/5 p-3 rounded-lg border border-accent-red/15">
                                {r.error || 'Failed to extract body content.'}
                              </p>
                            )}

                            {r.success && (
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono text-steel font-bold uppercase pt-1">
                                <span>Extraction: {r.extraction_method}</span>
                                {r.language && <span>• Lang: {r.language}</span>}
                                {r.author && <span>• Author: {r.author}</span>}
                                {r.published_date && <span>• Date: {r.published_date}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SEARCH / RESEARCH RESULTS */}
                    {(endpoint === '/v1/search' || endpoint === '/v1/research') && (results.results || results.sources) && (
                      <div className="space-y-4">
                        <span className="block text-[10px] font-mono text-slate font-bold uppercase tracking-wider">
                          Ranked Nodes ({results.results?.length || results.sources?.length || 0})
                        </span>
                        
                        {(results.results || results.sources || []).map((r, i) => (
                          <div key={(r.url || '') + i} className="bg-surface-code/40 border border-hairline p-5 rounded-xl space-y-3 font-sans transition-all hover:border-hairline-strong hover:bg-surface-code/60">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <a 
                                  href={r.url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="font-semibold text-xs text-ink hover:text-[#3b9eff] transition-colors flex items-center gap-1"
                                >
                                  {r.title || 'Untitled Node'}
                                  <ExternalLink size={10} className="opacity-60 text-slate" />
                                </a>
                                <span className="block text-[10px] font-mono text-slate truncate max-w-sm sm:max-w-md">{r.url}</span>
                              </div>
                              {r.score !== undefined && (
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  <span className="px-1.5 py-0.5 rounded-full bg-[#121210] border border-hairline text-[#3b9eff] font-mono text-[9px] font-bold">
                                    score: {r.score.toFixed(3)}
                                  </span>
                                  <div className="w-16 h-1 bg-[#1c1c19] rounded overflow-hidden border border-hairline">
                                    <div className="h-full bg-[#3b9eff] rounded animate-pulse" style={{ width: `${r.score * 100}%` }}></div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-slate leading-relaxed bg-[#0c0c0b] p-3 rounded-lg border border-hairline font-sans">
                              {r.content || 'Boilerplate stripped. No body payload.'}
                            </p>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono text-steel font-bold uppercase pt-1">
                              {r.source_type && (
                                <span className="flex items-center gap-1 text-primary">
                                  <Layers size={10} /> {r.source_type}
                                </span>
                              )}
                              {r.published_date && <span>• Date: {r.published_date}</span>}
                              {r.author && <span>• Author: {r.author}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Console Action Bar */}
            {results && (
              <div className="px-5 py-3.5 bg-[#0a0a09] border-t border-hairline flex justify-end gap-3 rounded-b-2xl">
                <button
                  onClick={() => handleCopyResponse(JSON.stringify(results, null, 2))}
                  className="button-ghost text-xs h-[32px] !text-slate hover:!text-ink hover:bg-cream-soft/20 cursor-pointer"
                >
                  <Copy size={12} className="mr-1" />
                  {copiedResponse ? 'Copied!' : 'Copy Output'}
                </button>
                <a
                  href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(results, null, 2))}`}
                  download={`searchmind_response_${Date.now()}.json`}
                  className="button-primary text-xs h-[32px] font-bold flex items-center justify-center cursor-pointer shadow-md"
                  style={{ backgroundColor: activeConf.accentColor }}
                >
                  <Download size={12} className="mr-1" />
                  Download JSON
                </a>
              </div>
            )}

          </div>



        </div>
        
      </div>
    </div>
  )
}
