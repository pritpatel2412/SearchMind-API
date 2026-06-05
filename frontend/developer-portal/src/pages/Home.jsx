import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Terminal, Key, ShieldCheck, Cpu, Code, CheckCircle, Sparkles, Database, Zap, Copy, ArrowRight, Play, Server, AlertCircle, HelpCircle } from 'lucide-react'

export default function Home({ token, setToken, user, setUser, setApiKey }) {
  const [isRegister, setIsRegister] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeTab, setCodeTab] = useState('python')
  const [copiedText, setCopiedText] = useState(false)
  
  // Terminal typewriter simulation state
  const [terminalLineIndex, setTerminalLineIndex] = useState(0)
  const [terminalLines, setTerminalLines] = useState([])
  const navigate = useNavigate()

  const terminalSequence = [
    { type: 'cmd', text: 'curl -X POST https://api.searchmind.dev/v1/search \\' },
    { type: 'cmd', text: '  -H "X-API-Key: sm_live_d8a3...9f2a" \\' },
    { type: 'cmd', text: '  -d \'{"query": "LangGraph multi-agent systems 2026", "depth": "advanced"}\'' },
    { type: 'status', text: 'Connecting to SearchMind fallback pipeline...' },
    { type: 'status', text: 'Query routed to Brave Search API (142ms)...' },
    { type: 'status', text: 'Parsing 5 top urls using Trafilatura...' },
    { type: 'status', text: 'Running LLM re-ranking & synthesis...' },
    { type: 'res', text: '{' },
    { type: 'res', text: '  "query": "LangGraph multi-agent systems 2026",' },
    { type: 'res', text: '  "answer": "Multi-agent architectures in LangGraph leverage centralized routers and state sharing patterns to orchestrate sub-agents. State is passed via shared graphs, and agents run in parallel threads for asynchronous execution.",' },
    { type: 'res', text: '  "results_count": 5,' },
    { type: 'res', text: '  "cached": false,' },
    { type: 'res', text: '  "latency_ms": 328' },
    { type: 'res', text: '}' }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      if (terminalLineIndex < terminalSequence.length) {
        setTerminalLines(prev => [...prev, terminalSequence[terminalLineIndex]])
        setTerminalLineIndex(prev => prev + 1)
      } else {
        setTimeout(() => {
          setTerminalLines([])
          setTerminalLineIndex(0)
        }, 5000)
      }
    }, 800)
    return () => clearInterval(timer)
  }, [terminalLineIndex])

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = isRegister ? '/v1/auth/register' : '/v1/auth/login'
    const body = isRegister 
      ? { email, password, full_name: fullName }
      : { email, password }

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed')
      }

      setToken(data.access_token)
      setUser({ id: data.user_id, email: data.email, plan: data.plan })
      if (data.full_key) {
        setApiKey(data.full_key)
      } else {
        fetchKeys(data.access_token)
      }
      
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchKeys = async (tokenStr) => {
    try {
      const res = await fetch('http://localhost:8000/v1/api-keys', {
        headers: { 'Authorization': `Bearer ${tokenStr}` }
      })
      const data = await res.json()
      if (res.ok && data.length > 0) {
        setApiKey(data[0].full_key || '')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCopyCommand = () => {
    navigator.clipboard.writeText("docker compose up --build")
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  const pythonCode = `# Python SDK
from searchmind import SearchMindClient

client = SearchMindClient(api_key="sm_live_••••••••••••")
result = client.search(
    query="LangGraph multi-agent patterns 2026",
    num_results=5,
    search_depth="advanced",
    include_answer=True
)

print(result.answer)
`

  const langchainCode = `# LangChain Integration
from searchmind.langchain_tool import SearchMindTool

# Initialize tool directly
tool = SearchMindTool(api_key="sm_live_••••••••••••")

# Bind to agent executor
agent = initialize_agent(
    tools=[tool], 
    llm=chat_llm, 
    agent="zero-shot-react-description"
)
`

  const langgraphCode = `# LangGraph Multi-Agent Nodes
from searchmind.langgraph_tool import create_searchmind_tools

# Generates search_web, extract_content, deep_research
tools = create_searchmind_tools(api_key="sm_live_••••••••••••")

# Inject directly as tool nodes
tool_node = ToolNode(tools)
graph.add_node("search_agent", tool_node)
`

  return (
    <div className="w-full bg-canvas text-ink min-h-screen relative flex flex-col items-center">
      
      {/* 1. HERO STRIPE SECTION (Sunset Band Background) */}
      <section className="w-full hero-band-sunset relative py-20 md:py-32 flex justify-center border-b border-hairline">
        {/* Abstract mountain silhouette SVG overlay */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none select-none">
          <svg className="w-full h-full object-cover" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,224L120,208C240,192,480,160,720,176C960,192,1200,256,1320,288L1440,320L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z" fill="#962A06"></path>
            <path d="M0,160L120,176C240,192,480,224,720,208C960,192,1200,128,1320,96L1440,64L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z" fill="#111317" opacity="0.3"></path>
          </svg>
        </div>

        <div className="w-full max-w-7xl px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center text-left relative z-10">
          {/* Left narrative content */}
          <div className="lg:col-span-7 space-y-8 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-black/20 text-white/95 text-[11px] font-mono tracking-[0.35px]">
              <Sparkles size={11} className="text-sunshine-300" />
              <span>AI-NATIVE SEARCH LAYER</span>
            </div>

            <h1 className="text-hero-display text-white">
              Search for <br />
              developers. <br />
              Reimagined.
            </h1>

            <p className="text-subtitle text-white/85 max-w-xl">
              Clean, ranked, LLM-ready web search results for LangChain pipelines, LangGraph workflows, and RAG systems. Brave, SerpAPI, and DuckDuckGo fallback orchestration. Built on true developer ergonomics.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {token ? (
                <Link to="/dashboard" className="button-dark font-semibold px-6">
                  Open Dashboard
                  <ArrowRight size={14} className="ml-2" />
                </Link>
              ) : (
                <a href="#auth-section" className="button-dark font-semibold px-6">
                  Start for Free
                  <ArrowRight size={14} className="ml-2" />
                </a>
              )}
              <Link to="/docs" className="button-secondary border-white/30 text-white hover:bg-white/10 font-semibold px-6">
                Explore API Docs
              </Link>
            </div>

            {/* Core Latency specs */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-white/70 pt-4 border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
                99.9% Uptime
              </span>
              <span className="text-white/20">|</span>
              <span>LangChain & LangGraph ready</span>
              <span className="text-white/20">|</span>
              <span className="text-sunshine-300 font-semibold">
                &lt; 200ms avg latency
              </span>
            </div>
          </div>

          {/* Right Typewriter Code Window */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-surface-code border border-white/10 rounded-lg overflow-hidden shadow-2xl">
              {/* Chrome Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-surface-code/80 border-b border-white/5">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-red opacity-80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-yellow opacity-80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-green opacity-80"></span>
                </div>
                <span className="text-[11px] font-mono text-on-dark-muted">curl_terminal.sh</span>
                <div className="w-8"></div>
              </div>
              
              {/* Console Output */}
              <div className="p-6 font-mono text-[11px] sm:text-xs text-left min-h-[340px] max-h-[400px] overflow-y-auto space-y-2.5 bg-surface-code text-on-dark">
                {terminalLines.map((line, i) => (
                  <div key={i} className="transition-all duration-300">
                    {line.type === 'cmd' && (
                      <div className="text-sunshine-300 font-medium">
                        <span className="text-on-dark-muted select-none">$ </span>
                        {line.text}
                      </div>
                    )}
                    {line.type === 'status' && (
                      <div className="text-on-dark-muted pl-4 italic">
                        {line.text}
                      </div>
                    )}
                    {line.type === 'res' && (
                      <pre className="text-accent-green pl-4 bg-white/5 py-1 rounded overflow-x-auto border border-white/5">
                        <code>{line.text}</code>
                      </pre>
                    )}
                  </div>
                ))}
                {terminalLineIndex < terminalSequence.length && (
                  <div className="flex items-center gap-1 text-primary">
                    <span className="text-on-dark-muted select-none">$ </span>
                    <span className="w-1.5 h-3.5 bg-primary animate-pulse"></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ATMOSPHERIC SECTION METRICS (GLOW ORANGE BACKDROP) */}
      <section className="w-full py-24 bg-canvas border-t border-hairline relative glow-orange">
        <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-20 relative z-10">
          
          {/* Metrics strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-hairline-strong text-center">
            <div id="latency-section" className="flex flex-col items-center justify-center p-2">
              <span className="text-micro-uppercase text-slate mb-2">Core Latency</span>
              <span className="text-stat-display text-ink">&lt; 142ms</span>
              <span className="text-caption text-steel font-mono mt-1">average request runtime</span>
            </div>
            <div id="reliability-section" className="flex flex-col items-center justify-center p-2 pt-6 lg:pt-2">
              <span className="text-micro-uppercase text-slate mb-2">Liveness Probe</span>
              <span className="text-stat-display text-ink">99.98%</span>
              <span className="text-caption text-steel font-mono mt-1">uptime SLA guarantee</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 pt-6 lg:pt-2">
              <span className="text-micro-uppercase text-slate mb-2">Failover Chain</span>
              <span className="text-stat-display text-ink">3 Layers</span>
              <span className="text-caption text-steel font-mono mt-1">Brave &rarr; Serp &rarr; DDG</span>
            </div>
            <div id="caching-section" className="flex flex-col items-center justify-center p-2 pt-6 lg:pt-2">
              <span className="text-micro-uppercase text-slate mb-2">Hot Store Cache</span>
              <span className="text-stat-display text-ink">Dual-Tier</span>
              <span className="text-caption text-steel font-mono mt-1">Redis + Postgres indexes</span>
            </div>
          </div>

          {/* Feature Grid */}
          <div id="features-section" className="space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <h2 className="text-heading-2 text-ink">Everything Your Pipeline Needs</h2>
              <p className="text-body-md text-slate">High-throughput search engine endpoints engineered for structured LLM agents.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <div className="card-base flex flex-col justify-between min-h-[240px] hover:bg-cream-soft transition-colors">
                <div className="space-y-3">
                  <div className="p-2 rounded bg-cream border border-beige-deep w-fit text-primary">
                    <Terminal size={16} />
                  </div>
                  <h3 className="text-heading-5 text-ink">Web Search API</h3>
                  <p className="text-body-sm text-slate">
                    Brave, SerpAPI, and DuckDuckGo fallback orchestration. Request basic snippets or full-page HTML extractions.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-primary bg-cream border border-beige-deep px-2.5 py-0.5 rounded w-fit mt-4 font-bold">
                  POST /v1/search
                </div>
              </div>

              {/* Feature 2 */}
              <div className="card-base flex flex-col justify-between min-h-[240px] hover:bg-cream-soft transition-colors">
                <div className="space-y-3">
                  <div className="p-2 rounded bg-cream border border-beige-deep w-fit text-primary">
                    <Cpu size={16} />
                  </div>
                  <h3 className="text-heading-5 text-ink">Content Extraction</h3>
                  <p className="text-body-sm text-slate">
                    Extract readable text content from URLs with Trafilatura and headless Playwright rendering for dynamic JS-heavy websites.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-primary bg-cream border border-beige-deep px-2.5 py-0.5 rounded w-fit mt-4 font-bold">
                  POST /v1/extract
                </div>
              </div>

              {/* Feature 3 */}
              <div className="card-base flex flex-col justify-between min-h-[240px] hover:bg-cream-soft transition-colors">
                <div className="space-y-3">
                  <div className="p-2 rounded bg-cream border border-beige-deep w-fit text-primary">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-heading-5 text-ink">Deep Research</h3>
                  <p className="text-body-sm text-slate">
                    Execute multiple parallel search queries, normalize results, extract body text, score relevance, and synthesize comprehensive cited summaries.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-primary bg-cream border border-beige-deep px-2.5 py-0.5 rounded w-fit mt-4 font-bold">
                  POST /v1/research
                </div>
              </div>

              {/* Feature 4 */}
              <div className="card-base flex flex-col justify-between min-h-[240px] hover:bg-cream-soft transition-colors">
                <div className="space-y-3">
                  <div className="p-2 rounded bg-cream border border-beige-deep w-fit text-primary">
                    <Zap size={16} />
                  </div>
                  <h3 className="text-heading-5 text-ink">Asynchronous Crawler</h3>
                  <p className="text-body-sm text-slate">
                    Queue domain-restricted, recursive crawling jobs in background Celery workers. Retrieve full-text structures via task monitoring.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-primary bg-cream border border-beige-deep px-2.5 py-0.5 rounded w-fit mt-4 font-bold">
                  POST /v1/crawl
                </div>
              </div>

              {/* Feature 5 */}
              <div className="card-base flex flex-col justify-between min-h-[240px] hover:bg-cream-soft transition-colors">
                <div className="space-y-3">
                  <div className="p-2 rounded bg-cream border border-beige-deep w-fit text-primary">
                    <Code size={16} />
                  </div>
                  <h3 className="text-heading-5 text-ink">LangChain & LangGraph</h3>
                  <p className="text-body-sm text-slate">
                    Drop-in SDK integrations for AI agents. Ready-to-use search and extract tools compatible with reactive agent graph nodes.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-primary bg-cream border border-beige-deep px-2.5 py-0.5 rounded w-fit mt-4 font-bold">
                  searchmind.langchain_tool
                </div>
              </div>

              {/* Feature 6 */}
              <div className="card-base flex flex-col justify-between min-h-[240px] hover:bg-cream-soft transition-colors">
                <div className="space-y-3">
                  <div className="p-2 rounded bg-cream border border-beige-deep w-fit text-primary">
                    <Database size={16} />
                  </div>
                  <h3 className="text-heading-5 text-ink">2-Tier Caching</h3>
                  <p className="text-body-sm text-slate">
                    Leverages an ultra-fast Redis memory cache backed up by a durable Postgres cache table. Auto cache warming ensures sub-10ms response times.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-primary bg-cream border border-beige-deep px-2.5 py-0.5 rounded w-fit mt-4 font-bold">
                  Redis + PostgreSQL
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. CODE STORY SPLIT SECTION (GLOW BLUE BACKDROP) */}
      <section id="sdk-section" className="w-full py-24 bg-canvas border-t border-hairline relative glow-blue">
        <div className="max-w-4xl mx-auto px-6 md:px-8 space-y-8 relative z-10">
          
          <div className="text-center space-y-2">
            <h2 className="text-heading-2 text-ink">Developer Ergonomics First</h2>
            <p className="text-body-md text-slate">Import SearchMind tools into your agent pipelines in 3 lines of code.</p>
          </div>

          {/* CODE WINDOW */}
          <div className="bg-surface-code border border-white/10 rounded-lg overflow-hidden shadow-xl">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between bg-surface-code px-6 py-3 border-b border-white/5">
              <div className="flex gap-4">
                {['python', 'langchain', 'langgraph'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCodeTab(tab)}
                    className={`flex items-center gap-1.5 text-xs font-mono font-bold transition-all pb-1.5 border-b-2 capitalize ${
                      codeTab === tab 
                        ? 'text-white border-primary' 
                        : 'text-on-dark-muted border-transparent hover:text-white'
                    }`}
                  >
                    {tab === 'python' ? 'Python SDK' : tab}
                  </button>
                ))}
              </div>
              
              {/* Traffic light chrome dots */}
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-red opacity-80"></span>
                <span className="w-2 h-2 rounded-full bg-accent-yellow opacity-80"></span>
                <span className="w-2 h-2 rounded-full bg-accent-green opacity-80"></span>
              </div>
            </div>

            {/* Code Content */}
            <div className="p-6 text-left overflow-x-auto font-mono text-[13px] text-white/90 leading-relaxed bg-surface-code">
              <pre>
                <code>
                  {codeTab === 'python' && pythonCode}
                  {codeTab === 'langchain' && langchainCode}
                  {codeTab === 'langgraph' && langgraphCode}
                </code>
              </pre>
            </div>
          </div>

        </div>
      </section>

      {/* 4. AUTH SECTION - COMPACT FORM INPUT INSET */}
      <section id="auth-section" className="w-full py-24 bg-canvas border-t border-hairline">
        <div className="max-w-md mx-auto px-6 relative z-10">
          
          {token ? (
            <div className="card-cream space-y-6 text-center shadow-md border border-beige-deep">
              <div className="p-4 bg-accent-green/10 border border-accent-green/20 rounded-full w-fit mx-auto text-accent-green">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-heading-3 text-ink">Access Authorized</h2>
              <p className="text-slate text-xs font-mono leading-relaxed">
                You are authenticated as <span className="text-ink font-semibold">{user?.email}</span> on the <strong className="text-primary capitalize font-bold">{user?.plan}</strong> plan.
              </p>
              <Link to="/dashboard" className="button-dark w-full text-center">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="card-cream space-y-6 shadow-md border border-beige-deep">
              <div className="flex justify-center border-b border-beige-deep pb-3">
                <button
                  onClick={() => { setIsRegister(true); setError(''); }}
                  className={`flex-1 pb-2 font-sans font-semibold text-sm transition-colors ${
                    isRegister ? 'text-primary border-b-2 border-primary' : 'text-slate hover:text-ink'
                  }`}
                >
                  Register
                </button>
                <button
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className={`flex-1 pb-2 font-sans font-semibold text-sm transition-colors ${
                    !isRegister ? 'text-primary border-b-2 border-primary' : 'text-slate hover:text-ink'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {error && (
                <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs rounded font-mono text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
                {isRegister && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-micro-uppercase text-slate">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      className="glass-input text-xs border border-beige-deep focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all rounded-md px-3 py-2"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-micro-uppercase text-slate">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    className="glass-input text-xs border border-beige-deep focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all rounded-md px-3 py-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-micro-uppercase text-slate">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="glass-input text-xs border border-beige-deep focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all rounded-md px-3 py-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="button-dark w-full mt-4 font-semibold font-sans"
                >
                  {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
                </button>
              </form>
            </div>
          )}

        </div>
      </section>

      {/* 5. PRICING SECTION (GLOW RED BACKDROP) */}
      <section id="pricing-section" className="w-full py-24 bg-canvas border-t border-hairline relative glow-red">
        <div className="max-w-5xl mx-auto px-6 md:px-8 space-y-12 relative z-10">
          
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-heading-2 text-ink">Simple, Transparent Pricing</h2>
            <p className="text-body-md text-slate">Start completely free. Upgrade as your platforms and agent requests scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Free Tier */}
            <div className="card-base text-left flex flex-col justify-between space-y-6 hover:bg-cream-soft transition-all">
              <div className="space-y-3">
                <span className="text-micro-uppercase bg-cream text-slate border border-beige-deep px-2.5 py-0.5 rounded-full">FREE</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-stat-display text-ink">$0</span>
                  <span className="text-caption text-steel font-mono ml-1">/mo</span>
                </div>
                <p className="text-body-sm text-slate">Ideal for testing search queries and initial sandbox designs.</p>
              </div>
              <ul className="space-y-2 text-xs text-slate font-mono p-4 border border-hairline rounded-lg bg-surface-code/40">
                <li className="flex items-center gap-2">✓ 1,000 requests / month</li>
                <li className="flex items-center gap-2">✓ 5 requests / minute limit</li>
                <li className="flex items-center gap-2">✓ Basic search snippets</li>
                <li className="flex items-center gap-2">✓ Core URL content extractor</li>
              </ul>
              <a href="#auth-section" className="button-outline w-full text-center">
                Start Free
              </a>
            </div>

            {/* Starter Tier (Featured) */}
            <div className="card-cream border-2 border-primary text-left flex flex-col justify-between space-y-6 relative hover:brightness-105 transition-all shadow-md">
              <div className="absolute top-0 right-6 -translate-y-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-primary text-white">
                Popular
              </div>
              <div className="space-y-3">
                <span className="text-micro-uppercase bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">STARTER</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-stat-display text-ink">$29</span>
                  <span className="text-caption text-steel font-mono ml-1">/mo</span>
                </div>
                <p className="text-body-sm text-charcoal">Perfect for running autonomous agents and lightweight workflows.</p>
              </div>
              <ul className="space-y-2 text-xs text-slate font-mono p-4 border border-beige-deep rounded-lg bg-surface-code/40">
                <li className="flex items-center gap-2">✓ 10,000 requests / month</li>
                <li className="flex items-center gap-2">✓ 30 requests / minute limit</li>
                <li className="flex items-center gap-2">✓ Advanced deep full-page search</li>
                <li className="flex items-center gap-2">✓ Celery async background crawl</li>
                <li className="flex items-center gap-2">✓ LLM summary synthesis</li>
              </ul>
              <a href="#auth-section" className="button-primary w-full text-center font-bold">
                Subscribe Now
              </a>
            </div>

            {/* Pro Tier */}
            <div className="card-base text-left flex flex-col justify-between space-y-6 hover:bg-cream-soft transition-all">
              <div className="space-y-3">
                <span className="text-micro-uppercase bg-cream text-slate border border-beige-deep px-2.5 py-0.5 rounded-full">PRO</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-stat-display text-ink">$99</span>
                  <span className="text-caption text-steel font-mono ml-1">/mo</span>
                </div>
                <p className="text-body-sm text-slate">For scaling production pipelines, large databases, and team workflows.</p>
              </div>
              <ul className="space-y-2 text-xs text-slate font-mono p-4 border border-hairline rounded-lg bg-surface-code/40">
                <li className="flex items-center gap-2">✓ 100,000 requests / month</li>
                <li className="flex items-center gap-2">✓ 100 requests / minute limit</li>
                <li className="flex items-center gap-2">✓ Advanced deep search & crawl</li>
                <li className="flex items-center gap-2">✓ High-priority execution queues</li>
                <li className="flex items-center gap-2">✓ Multi-node caching rules</li>
              </ul>
              <a href="#auth-section" className="button-outline w-full text-center">
                Subscribe Now
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 6. ECOSYSTEM INTEGRATION */}
      <section className="w-full py-24 bg-canvas border-t border-hairline">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12 relative z-10">
          <div className="space-y-3">
            <h2 className="text-heading-2 text-ink">Ecosystem Integration</h2>
            <p className="text-body-md text-slate">SearchMind works natively with your entire development stack.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 items-center max-w-4xl mx-auto">
            {['LangChain', 'LangGraph', 'OpenAI SDK', 'NVIDIA NIM', 'Groq API', 'FastAPI', 'Neon DB', 'Redis'].map((eco) => (
              <span key={eco} className="text-body-sm-medium text-slate border border-hairline-strong bg-cream/45 px-4 py-2.5 rounded-md">
                {eco}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 7. DOCKER UP BAND (cta-banner-cream) */}
      <section className="w-full py-24 bg-canvas border-t border-hairline">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          
          <div className="bg-cream border border-beige-deep p-12 rounded-lg text-center space-y-6 relative overflow-hidden">
            <h2 className="text-heading-1 text-ink">Build your first agent search in &lt; 5 minutes.</h2>
            <p className="text-body-sm text-slate max-w-lg mx-auto">No credit card required. Free tier available. Start a local server with Docker in one command:</p>
            
            <div className="flex items-center justify-between bg-surface-code max-w-sm mx-auto px-4 py-3 rounded-md border border-beige-deep font-mono text-xs sm:text-sm text-primary font-bold">
              <span>docker compose up --build</span>
              <button 
                onClick={handleCopyCommand}
                className="text-steel hover:text-primary transition-colors"
                title="Copy Command"
              >
                {copiedText ? <span className="text-[10px] text-accent-green font-bold">Copied!</span> : <Copy size={13} />}
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}
