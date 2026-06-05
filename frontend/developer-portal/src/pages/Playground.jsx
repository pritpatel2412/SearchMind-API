import React, { useState } from 'react'
import { Play, Sparkles, AlertCircle, Clock, Database, ArrowRight, ExternalLink, Copy, Check, Download, Server, Cpu, Layers, Terminal, Search, Globe, Calendar, BookOpen, GitBranch, Sliders, Settings2 } from 'lucide-react'

export default function Playground({ token, apiKey }) {
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

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [latency, setLatency] = useState(0)
  const [codeLangTab, setCodeLangTab] = useState('curl')
  const [copiedKey, setCopiedKey] = useState(false)
  const [responseTab, setResponseTab] = useState('json')
  const [queryLogs, setQueryLogs] = useState([])

  const addLog = (msg) => {
    setQueryLogs(prev => [...prev, msg])
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResults(null)
    setQueryLogs([])
    
    const startTime = Date.now()
    const urlKey = apiKey || 'sm_live_YOUR_KEY'

    let requestUrl = 'http://localhost:8000' + endpoint
    let payload = {}

    if (endpoint === '/v1/search') {
      if (!query.trim()) {
        setLoading(false)
        return
      }
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
      
      addLog("Initializing SearchMind query resolver...")
      addLog(`Routing search to primary Brave Index...`)
    } else if (endpoint === '/v1/extract') {
      if (!extractUrls.trim()) {
        setLoading(false)
        return
      }
      const urlsArray = extractUrls.split('\n').map(u => u.trim()).filter(Boolean)
      payload = {
        urls: urlsArray,
        use_js_rendering: useJsRendering,
        max_content_length: parseInt(maxContentLength)
      }
      addLog(`Launching extraction pipeline for ${urlsArray.length} nodes...`)
      if (useJsRendering) {
        addLog("Headless Playwright instances spawned for JS rendering...")
      }
    } else if (endpoint === '/v1/research') {
      if (!researchQuery.trim()) {
        setLoading(false)
        return
      }
      payload = {
        query: researchQuery.trim(),
        max_sources: parseInt(maxSources),
        search_depth: 'advanced',
        include_summary: true
      }
      addLog("Deep Research Mode enabled: spawning parallel sub-queries...")
      addLog("Fetching and cross-referencing nodes concurrently...")
    } else if (endpoint === '/v1/crawl') {
      if (!crawlUrl.trim()) {
        setLoading(false)
        return
      }
      payload = {
        url: crawlUrl.trim(),
        max_depth: parseInt(maxDepth),
        max_pages: parseInt(maxPages)
      }
      addLog("Queueing asynchronous crawl task to Celery...")
    }

    try {
      const headers = {
        'X-API-Key': urlKey,
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      setLatency(Date.now() - startTime)
      
      if (!response.ok) {
        throw new Error(data.detail || 'API request failed')
      }

      addLog("Response payload received. Parsing JSON...")
      setResults(data)
    } catch (err) {
      addLog("Pipeline returned exception.")
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const getGeneratedCode = () => {
    const keyString = apiKey ? apiKey : 'sm_live_your_secret_key'
    if (endpoint === '/v1/search') {
      if (codeLangTab === 'curl') {
        return `curl -X POST http://localhost:8000/v1/search \\
  -H "X-API-Key: ${keyString}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "${query || 'search query'}",
    "num_results": ${numResults},
    "search_depth": "${searchDepth}",
    "include_answer": ${includeAnswer},
    "topic": "${topic}"${timeRange ? `,\n    "time_range": "${timeRange}"` : ''}
  }'`
      } else if (codeLangTab === 'python') {
        return `from searchmind import SearchMindClient

client = SearchMindClient(api_key="${keyString}")
result = client.search(
    query="${query || 'search query'}",
    num_results=${numResults},
    search_depth="${searchDepth}",
    topic="${topic}"${timeRange ? `,\n    time_range="${timeRange}"` : ''}
)`
      } else {
        return `fetch('http://localhost:8000/v1/search', {
  method: 'POST',
  headers: {
    'X-API-Key': '${keyString}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: "${query || 'search query'}",
    num_results: ${numResults},
    search_depth: "${searchDepth}",
    topic: "${topic}"
  })
}).then(res => res.json()).then(console.log)`
      }
    } else if (endpoint === '/v1/extract') {
      const urlsArray = extractUrls.split('\n').map(u => u.trim()).filter(Boolean)
      const urlsJson = JSON.stringify(urlsArray.length ? urlsArray : ["https://example.com"])
      if (codeLangTab === 'curl') {
        return `curl -X POST http://localhost:8000/v1/extract \\
  -H "X-API-Key: ${keyString}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "urls": ${urlsJson},
    "use_js_rendering": ${useJsRendering},
    "max_content_length": ${maxContentLength}
  }'`
      } else if (codeLangTab === 'python') {
        return `from searchmind import SearchMindClient

client = SearchMindClient(api_key="${keyString}")
result = client.extract(
    urls=${urlsJson.replace(/"/g, "'")},
    use_js_rendering=${useJsRendering ? 'True' : 'False'},
    max_content_length=${maxContentLength}
)`
      } else {
        return `fetch('http://localhost:8000/v1/extract', {
  method: 'POST',
  headers: {
    'X-API-Key': '${keyString}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    urls: ${urlsJson},
    use_js_rendering: ${useJsRendering}
  })
}).then(res => res.json()).then(console.log)`
      }
    } else if (endpoint === '/v1/research') {
      if (codeLangTab === 'curl') {
        return `curl -X POST http://localhost:8000/v1/research \\
  -H "X-API-Key: ${keyString}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "${researchQuery || 'research query'}",
    "max_sources": ${maxSources}
  }'`
      } else if (codeLangTab === 'python') {
        return `from searchmind import SearchMindClient

client = SearchMindClient(api_key="${keyString}")
result = client.research(
    query="${researchQuery || 'research query'}",
    max_sources=${maxSources}
)`
      } else {
        return `fetch('http://localhost:8000/v1/research', {
  method: 'POST',
  headers: {
    'X-API-Key': '${keyString}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: "${researchQuery || 'research query'}",
    max_sources: ${maxSources}
  })
}).then(res => res.json()).then(console.log)`
      }
    } else {
      if (codeLangTab === 'curl') {
        return `curl -X POST http://localhost:8000/v1/crawl \\
  -H "X-API-Key: ${keyString}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "${crawlUrl || 'https://example.com'}",
    "max_depth": ${maxDepth},
    "max_pages": ${maxPages}
  }'`
      } else if (codeLangTab === 'python') {
        return `from searchmind import SearchMindClient

# Background crawl - returns a Celery Task ID
client = SearchMindClient(api_key="${keyString}")
result = client._client.post(
    "http://localhost:8000/v1/crawl",
    json={
        "url": "${crawlUrl || 'https://example.com'}",
        "max_depth": ${maxDepth},
        "max_pages": ${maxPages}
    }
)`
      } else {
        return `fetch('http://localhost:8000/v1/crawl', {
  method: 'POST',
  headers: {
    'X-API-Key': '${keyString}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: "${crawlUrl || 'https://example.com'}",
    max_depth: ${maxDepth},
    max_pages: ${maxPages}
  })
}).then(res => res.json()).then(console.log)`
      }
    }
  }

  const generatedCode = getGeneratedCode()

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 space-y-8 text-left relative glow-blue">
      
      {/* Header */}
      <div>
        <h1 className="text-heading-1 text-ink">Search Playground</h1>
        <p className="text-caption text-steel mt-1">Configure endpoint parameters, inspect generated code snippets, and review live outputs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* LEFT PANEL — Request Builder */}
        <div className="lg:col-span-5 card-base space-y-6">
          
          {/* Custom Grid Endpoint Tabs */}
          <div className="flex flex-col gap-2">
            <span className="text-micro-uppercase text-slate">Target API Endpoint</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { path: '/v1/search', label: 'AI Search', icon: Search, desc: 'Web search + answers' },
                { path: '/v1/extract', label: 'URL Extract', icon: Layers, desc: 'Raw page content strip' },
                { path: '/v1/research', label: 'Deep Research', icon: Cpu, desc: 'Multi-query agent search' },
                { path: '/v1/crawl', label: 'Domain Crawl', icon: GitBranch, desc: 'Recursive site indexer' }
              ].map((item) => {
                const Icon = item.icon
                const isActive = endpoint === item.path
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      setEndpoint(item.path)
                      setResults(null)
                      setError('')
                    }}
                    className={`p-3 rounded-lg border text-left transition-all duration-300 relative group flex flex-col justify-between h-20 ${
                      isActive 
                        ? 'bg-cream-soft border-primary/60 shadow-[0_0_15px_rgba(241,90,36,0.1)]' 
                        : 'bg-surface border-hairline hover:border-beige-deep hover:bg-cream-soft/30'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`p-1.5 rounded transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'bg-cream text-slate group-hover:text-ink'}`}>
                        <Icon size={13} />
                      </span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>}
                    </div>
                    <div>
                      <span className={`block text-xs font-bold font-sans transition-colors ${isActive ? 'text-ink' : 'text-slate group-hover:text-ink'}`}>
                        {item.label}
                      </span>
                      <span className="block text-[9px] text-steel font-medium truncate mt-0.5 max-w-[120px]">
                        {item.desc}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSearch} className="space-y-5 border-t border-hairline pt-4">
            
            {/* SEARCH FORMS */}
            {endpoint === '/v1/search' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-micro-uppercase text-slate">Search Query</label>
                  <div className="relative flex items-stretch">
                    <span className="absolute left-3 top-3.5 text-slate pointer-events-none">
                      <Search size={13} />
                    </span>
                    <textarea
                      required
                      rows={2}
                      placeholder="Enter keywords or questions..."
                      className="glass-input !pl-10 text-xs resize-none border border-beige-deep focus:border-primary w-full h-auto min-h-[60px] focus:ring-1 focus:ring-primary/40 focus:shadow-[0_0_12px_rgba(241,90,36,0.15)] transition-all"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-micro-uppercase text-slate">Search Depth</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                        <Sliders size={13} />
                      </span>
                      <select 
                        className="glass-input !pl-10 text-xs cursor-pointer font-sans border border-beige-deep focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all" 
                        value={searchDepth} 
                        onChange={(e) => setSearchDepth(e.target.value)}
                      >
                        <option value="basic">Basic (Fast)</option>
                        <option value="advanced">Advanced (Deep)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-micro-uppercase text-slate">Results (1-20)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                        <Database size={13} />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        className="glass-input !pl-10 text-xs font-sans border border-beige-deep focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all"
                        value={numResults}
                        onChange={(e) => setNumResults(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-micro-uppercase text-slate">Topic Type</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                        <Globe size={13} />
                      </span>
                      <select 
                        className="glass-input !pl-10 text-xs cursor-pointer font-sans border border-beige-deep focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all" 
                        value={topic} 
                        onChange={(e) => setTopic(e.target.value)}
                      >
                        <option value="general">General</option>
                        <option value="news">News</option>
                        <option value="finance">Finance</option>
                        <option value="science">Science</option>
                        <option value="technology">Technology</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-micro-uppercase text-slate">Time Limit</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                        <Calendar size={13} />
                      </span>
                      <select 
                        className="glass-input !pl-10 text-xs cursor-pointer font-sans border border-beige-deep focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all" 
                        value={timeRange} 
                        onChange={(e) => setTimeRange(e.target.value)}
                      >
                        <option value="">Any Time</option>
                        <option value="pd">Past Day (pd)</option>
                        <option value="pw">Past Week (pw)</option>
                        <option value="pm">Past Month (pm)</option>
                        <option value="py">Past Year (py)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 py-2 border-t border-hairline mt-2">
                  <label 
                    className={`flex items-center justify-between p-3 rounded-lg border font-mono text-xs cursor-pointer transition-all duration-300 ${
                      includeAnswer 
                        ? 'bg-cream-soft border-primary/30 text-ink' 
                        : 'bg-surface/50 border-hairline text-slate hover:border-beige-deep'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className={includeAnswer ? 'text-primary' : 'text-slate'} />
                      <span>SYNTHESIZE ANSWER</span>
                    </div>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-primary cursor-pointer rounded border border-beige-deep transition-all"
                      checked={includeAnswer}
                      onChange={(e) => setIncludeAnswer(e.target.checked)}
                    />
                  </label>
                  
                  <label 
                    className={`flex items-center justify-between p-3 rounded-lg border font-mono text-xs cursor-pointer transition-all duration-300 ${
                      includeRawContent 
                        ? 'bg-cream-soft border-primary/30 text-ink' 
                        : 'bg-surface/50 border-hairline text-slate hover:border-beige-deep'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen size={13} className={includeRawContent ? 'text-primary' : 'text-slate'} />
                      <span>INCLUDE CITATIONS</span>
                    </div>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-primary cursor-pointer rounded border border-beige-deep transition-all"
                      checked={includeRawContent}
                      onChange={(e) => setIncludeRawContent(e.target.checked)}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* EXTRACT FORMS */}
            {endpoint === '/v1/extract' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-micro-uppercase text-slate">URLs (one per line, max 10)</label>
                  <div className="relative flex items-stretch">
                    <span className="absolute left-3 top-3.5 text-slate pointer-events-none">
                      <Globe size={13} />
                    </span>
                    <textarea
                      required
                      rows={4}
                      placeholder="https://example.com/article&#10;https://another-url.org/docs"
                      className="glass-input !pl-10 text-xs resize-none border border-beige-deep focus:border-primary w-full h-auto focus:ring-1 focus:ring-primary/40 focus:shadow-[0_0_12px_rgba(241,90,36,0.15)] transition-all"
                      value={extractUrls}
                      onChange={(e) => setExtractUrls(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-micro-uppercase text-slate">Max Content Length</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                      <Settings2 size={13} />
                    </span>
                    <input
                      type="number"
                      className="glass-input !pl-10 text-xs border border-beige-deep focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all"
                      value={maxContentLength}
                      onChange={(e) => setMaxContentLength(e.target.value)}
                    />
                  </div>
                </div>

                <label 
                  className={`flex items-center justify-between p-3 rounded-lg border font-mono text-xs cursor-pointer transition-all duration-300 ${
                    useJsRendering 
                      ? 'bg-cream-soft border-primary/30 text-ink' 
                      : 'bg-surface/50 border-hairline text-slate hover:border-beige-deep'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cpu size={13} className={useJsRendering ? 'text-primary' : 'text-slate'} />
                    <span>DYNAMIC JS RENDERING (PLAYWRIGHT)</span>
                  </div>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-primary cursor-pointer rounded border border-beige-deep transition-all"
                    checked={useJsRendering}
                    onChange={(e) => setUseJsRendering(e.target.checked)}
                  />
                </label>
              </div>
            )}

            {/* RESEARCH FORMS */}
            {endpoint === '/v1/research' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-micro-uppercase text-slate">Research Topic</label>
                  <div className="relative flex items-stretch">
                    <span className="absolute left-3 top-3.5 text-slate pointer-events-none">
                      <Search size={13} />
                    </span>
                    <textarea
                      required
                      rows={3}
                      placeholder="Provide a comprehensive subject query to research..."
                      className="glass-input !pl-10 text-xs resize-none border border-beige-deep focus:border-primary w-full h-auto focus:ring-1 focus:ring-primary/40 focus:shadow-[0_0_12px_rgba(241,90,36,0.15)] transition-all"
                      value={researchQuery}
                      onChange={(e) => setResearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-micro-uppercase text-slate">Max Reference Sources (1-15)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                      <BookOpen size={13} />
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      className="glass-input !pl-10 text-xs font-mono border border-beige-deep focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all"
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
                  <label className="text-micro-uppercase text-slate">Crawl Seed Domain URL</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                      <Globe size={13} />
                    </span>
                    <input
                      type="url"
                      required
                      placeholder="https://docs.searchmind.dev"
                      className="glass-input !pl-10 text-xs border border-beige-deep focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all"
                      value={crawlUrl}
                      onChange={(e) => setCrawlUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-micro-uppercase text-slate">Max Depth (1-5)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                        <GitBranch size={13} />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        className="glass-input !pl-10 text-xs font-mono border border-beige-deep focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all"
                        value={maxDepth}
                        onChange={(e) => setMaxDepth(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-micro-uppercase text-slate">Max Pages (1-100)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
                        <Database size={13} />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        className="glass-input !pl-10 text-xs font-mono border border-beige-deep focus:border-primary w-full focus:ring-1 focus:ring-primary/40 transition-all"
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
              disabled={loading}
              className={`button-primary w-full mt-4 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                loading ? 'animate-pulse opacity-85 cursor-wait' : 'hover:scale-[1.01]'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Executing Pipeline...
                </>
              ) : (
                <>
                  <Play size={12} fill="currentColor" className="text-white" />
                  Run Query
                </>
              )}
            </button>
          </form>

          {/* CODE WINDOW */}
          <div className="space-y-3 pt-4 border-t border-hairline">
            <div className="flex items-center justify-between">
              <span className="text-micro-uppercase text-slate">Generated Request</span>
              <div className="flex gap-2">
                {['curl', 'python', 'js'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLangTab(lang)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all capitalize border ${
                      codeLangTab === lang 
                        ? 'bg-cream-deeper text-ink border-beige-deep' 
                        : 'text-slate border-transparent hover:text-ink'
                    }`}
                  >
                    {lang === 'js' ? 'JS' : lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative bg-surface-code border border-white/10 rounded-lg overflow-hidden shadow-lg">
              <div className="flex gap-1.5 px-3 py-2 bg-surface-code/80 border-b border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-red opacity-80"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow opacity-80"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green opacity-80"></span>
              </div>
              <pre className="p-4 rounded-b text-[10px] font-mono text-on-dark overflow-x-auto max-h-[140px] text-left leading-relaxed">
                <code>{generatedCode}</code>
              </pre>
              <button
                onClick={() => handleCopyCode(generatedCode)}
                className="absolute top-8 right-2 p-1 rounded bg-surface-code border border-white/10 text-on-dark-muted hover:text-white transition-colors"
                title="Copy snippet"
              >
                {copiedKey ? <Check size={11} className="text-accent-green" /> : <Copy size={11} />}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Response Viewer */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Diagnostic status line */}
          <div className="bg-cream border border-beige-deep px-4 py-3 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${loading ? 'bg-accent-blue animate-pulse' : error ? 'bg-accent-red' : results ? 'bg-accent-green' : 'bg-stone'}`}></span>
                <span className="font-bold text-ink uppercase">
                  {loading ? 'PROCESSING' : error ? 'ERROR' : results ? '200 OK' : 'IDLE'}
                </span>
              </div>
              {results && (
                <>
                  <span className="text-beige-deep">|</span>
                  <span className="flex items-center gap-1 text-charcoal">
                    <Clock size={11} /> {latency}ms
                  </span>
                  <span className="text-beige-deep">|</span>
                  <span className="flex items-center gap-1 text-charcoal">
                    <Database size={11} fill="none" /> 
                    {results.cached ? 'CACHED' : 'LIVE FETCH'}
                  </span>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                disabled={!results}
                onClick={() => setResponseTab('json')}
                className={`text-[10px] font-mono px-2.5 py-1 rounded transition-all border ${
                  responseTab === 'json' ? 'bg-cream-deeper text-ink border-beige-deep' : 'text-slate border-transparent hover:text-ink disabled:opacity-40'
                }`}
              >
                JSON Payload
              </button>
              <button
                disabled={!results || endpoint === '/v1/crawl'}
                onClick={() => setResponseTab('formatted')}
                className={`text-[10px] font-mono px-2.5 py-1 rounded transition-all border ${
                  responseTab === 'formatted' ? 'bg-cream-deeper text-ink border-beige-deep' : 'text-slate border-transparent hover:text-ink disabled:opacity-40'
                }`}
              >
                Formatted Cards
              </button>
            </div>
          </div>

          {/* Response Console */}
          <div className="bg-surface-code border border-white/10 rounded-lg min-h-[460px] overflow-hidden flex flex-col justify-between shadow-xl">
            
            {/* Logs stream while querying */}
            {loading && (
              <div className="p-6 font-mono text-xs text-accent-blue space-y-2 flex-grow">
                {queryLogs.map((log, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <span className="text-on-dark-muted select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-4">
                  <div className="w-3.5 h-3.5 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"></div>
                  <span className="text-on-dark-muted italic">Resolving response stream...</span>
                </div>
              </div>
            )}

            {/* Error output */}
            {error && !loading && (
              <div className="p-6 space-y-4 flex-grow">
                <div className="p-4 bg-accent-red/20 border border-accent-red/30 text-white rounded flex gap-3 items-start font-mono text-xs text-left">
                  <AlertCircle className="flex-shrink-0 mt-0.5 text-accent-red" size={14} />
                  <div className="space-y-1">
                    <h5 className="font-bold uppercase tracking-wider text-accent-red">Pipeline Exception Raised</h5>
                    <p className="text-on-dark-muted">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!results && !loading && !error && (
              <div className="flex flex-col items-center justify-center text-center p-12 flex-grow gap-3">
                <Terminal className="text-on-dark-muted" size={24} />
                <div className="space-y-1">
                  <h4 className="font-mono text-xs text-on-dark-muted uppercase font-bold tracking-wider">Console Ready</h4>
                  <p className="text-xs text-on-dark-muted/80 max-w-xs">Submit a request parameters profile to print live API outputs.</p>
                </div>
              </div>
            )}

            {/* Success results viewer */}
            {results && !loading && !error && (
              <div className="p-5 overflow-y-auto flex-grow max-h-[500px] text-left border-t border-white/5">
                {responseTab === 'json' ? (
                  <pre className="text-xs font-mono text-accent-green leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
                    <code>{JSON.stringify(results, null, 2)}</code>
                  </pre>
                ) : (
                  <div className="space-y-6">
                    
                    {/* Render AI Answer Synthesis */}
                    {(results.answer || results.summary) && (
                      <div className="p-5 rounded-lg border border-white/10 bg-white/5 relative overflow-hidden space-y-2">
                        <div className="flex items-center gap-1.5 text-accent-orange font-mono text-[10px] font-bold uppercase tracking-wider">
                          <Sparkles size={13} /> Synthesis Output
                        </div>
                        <p className="text-white text-xs leading-relaxed font-sans font-medium">
                          {results.answer || results.summary}
                        </p>
                      </div>
                    )}

                    {/* Results list */}
                    <div className="space-y-4">
                      <span className="block text-[10px] font-mono text-on-dark-muted font-bold uppercase tracking-wider">
                        Ranked Nodes ({results.results?.length || results.sources?.length || 0})
                      </span>
                      
                      {((results.results || results.sources) || []).map((r, i) => (
                        <div key={r.url + i} className="bg-white/5 border border-white/10 p-5 rounded-lg space-y-3 font-sans transition-all">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <a 
                                href={r.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="font-semibold text-sm text-white hover:text-accent-blue transition-colors flex items-center gap-1"
                              >
                                {r.title || 'Untitled Node'}
                                <ExternalLink size={11} className="opacity-60 text-on-dark-muted" />
                              </a>
                              <span className="block text-[10px] font-mono text-on-dark-muted truncate max-w-sm sm:max-w-md">{r.url}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-accent-blue font-mono text-[9px] font-bold">
                                score: {r.score.toFixed(3)}
                              </span>
                              <div className="w-16 h-1 bg-white/5 rounded overflow-hidden">
                                <div className="h-full bg-accent-blue rounded" style={{ width: `${r.score * 100}%` }}></div>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-on-dark-muted leading-relaxed bg-white/5 p-3 rounded-md border border-white/5 font-sans">
                            {r.content || 'Boilerplate stripped. No body payload.'}
                          </p>

                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono text-on-dark-muted font-bold uppercase pt-1">
                            {r.source_type && (
                              <span className="flex items-center gap-1 text-accent-orange">
                                <Layers size={10} /> {r.source_type}
                              </span>
                            )}
                            {r.published_date && <span>• Date: {r.published_date}</span>}
                            {r.author && <span>• Author: {r.author}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Console Action Bar */}
            {results && (
              <div className="px-5 py-3 bg-surface-code border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => handleCopyCode(JSON.stringify(results, null, 2))}
                  className="button-ghost text-xs h-[30px] !text-on-dark-muted hover:!text-white hover:bg-white/5"
                >
                  <Copy size={12} className="mr-1" />
                  Copy Output
                </button>
                <a
                  href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(results, null, 2))}`}
                  download={`searchmind_response_${Date.now()}.json`}
                  className="button-primary text-xs h-[30px] font-bold"
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
