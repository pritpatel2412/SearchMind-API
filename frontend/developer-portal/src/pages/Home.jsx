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
    { type: 'status', text: '⚡ Connecting to SearchMind fallback pipeline...' },
    { type: 'status', text: '🔍 Query routed to Brave Search API (142ms)...' },
    { type: 'status', text: '📥 Parsing 5 top urls using Trafilatura...' },
    { type: 'status', text: '🤖 Running LLM re-ranking & synthesis...' },
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
    <div className="w-full bg-canvas text-ink min-h-screen relative overflow-hidden flex flex-col items-center">
      
      {/* 1. HERO STRIPE SECTION */}
      <section className="w-full max-w-7xl px-6 md:px-8 py-[128px] grid grid-cols-1 lg:grid-cols-12 gap-16 items-center text-left relative z-10">
        
        {/* Left narrative content */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hairline-strong bg-surface-elevated text-charcoal text-[11px] font-mono tracking-[0.35px]">
            <Sparkles size={11} className="text-accent-orange" />
            <span>AI-NATIVE SEARCH LAYER</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-[84px] font-display font-medium leading-[1.0] -tracking-[1.5px] text-ink">
            Search for <br />
            developers. <br />
            Reimagined.
          </h1>

          <p className="text-base sm:text-lg text-body font-sans max-w-xl leading-relaxed">
            Clean, ranked, LLM-ready web search results for LangChain pipelines, LangGraph workflows, and RAG systems. Brave, SerpAPI, and DuckDuckGo fallback orchestration. Built on true developer ergonomics.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {token ? (
              <Link to="/dashboard" className="button-primary font-semibold">
                Open Dashboard
                <ArrowRight size={14} className="ml-2" />
              </Link>
            ) : (
              <a href="#auth-section" className="button-primary font-semibold">
                Start for Free
                <ArrowRight size={14} className="ml-2" />
              </a>
            )}
            <Link to="/docs" className="button-ghost font-semibold">
              Explore API Docs
            </Link>
          </div>

          {/* Core Latency specs */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-mute pt-4 border-t border-hairline">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
              99.9% Uptime
            </span>
            <span className="text-hairline-strong">|</span>
            <span>LangChain & LangGraph ready</span>
            <span className="text-hairline-strong">|</span>
            <span className="text-accent-blue font-semibold">
              &lt; 200ms avg latency
            </span>
          </div>
        </div>

        {/* Right Typewriter Code Window */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-surface-deep border border-hairline-strong rounded-lg overflow-hidden shadow-2xl">
            {/* Chrome Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-surface-card border-b border-hairline-strong">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-red"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-accent-yellow"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-accent-green"></span>
              </div>
              <span className="text-[11px] font-mono text-mute">curl_terminal.sh</span>
              <div className="w-8"></div>
            </div>
            
            {/* Console Output */}
            <div className="p-6 font-mono text-[11px] sm:text-xs text-left min-h-[340px] max-h-[400px] overflow-y-auto space-y-2.5 bg-surface-deep text-body">
              {terminalLines.map((line, i) => (
                <div key={i} className="transition-all duration-300">
                  {line.type === 'cmd' && (
                    <div className="text-accent-blue font-medium">
                      <span className="text-mute select-none">$ </span>
                      {line.text}
                    </div>
                  )}
                  {line.type === 'status' && (
                    <div className="text-mute pl-4 italic">
                      {line.text}
                    </div>
                  )}
                  {line.type === 'res' && (
                    <pre className="text-accent-green pl-4 bg-surface-card/45 py-1 rounded overflow-x-auto border border-hairline">
                      <code>{line.text}</code>
                    </pre>
                  )}
                </div>
              ))}
              {terminalLineIndex < terminalSequence.length && (
                <div className="flex items-center gap-1 text-accent-blue">
                  <span className="text-mute select-none">$ </span>
                  <span className="w-1.5 h-3.5 bg-accent-blue animate-pulse"></span>
                </div>
              )}
            </div>
          </div>
        </div>

      </section>

      {/* 2. ATMOSPHERIC SECTION METRICS (GLOW ORANGE BACKDROP) */}
      <section className="w-full py-[96px] bg-canvas border-t border-hairline relative glow-orange">
        <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-20 relative z-10">
          
          {/* Metrics strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-hairline-strong/40 text-center">
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-mute mb-2 uppercase">Core Latency</span>
              <span className="text-3xl sm:text-4xl font-extrabold font-display text-ink">&lt; 142ms</span>
              <span className="text-[11px] text-mute font-mono mt-1">average request runtime</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 pt-6 lg:pt-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-mute mb-2 uppercase">Liveness Probe</span>
              <span className="text-3xl sm:text-4xl font-extrabold font-display text-ink">99.98%</span>
              <span className="text-[11px] text-mute font-mono mt-1">uptime SLA guarantee</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 pt-6 lg:pt-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-mute mb-2 uppercase">Failover Chain</span>
              <span className="text-3xl sm:text-4xl font-extrabold font-display text-ink">3 API Layers</span>
              <span className="text-[11px] text-mute font-mono mt-1">Brave &rarr; Serp &rarr; DDG</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 pt-6 lg:pt-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-mute mb-2 uppercase">Hot Store Cache</span>
              <span className="text-3xl sm:text-4xl font-extrabold font-display text-ink">Dual-Tier</span>
              <span className="text-[11px] text-mute font-mono mt-1">Redis + Postgres indexes</span>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl font-display font-medium text-ink -tracking-[0.8px]">Everything Your Pipeline Needs</h2>
              <p className="text-sm text-mute font-mono">High-throughput search engine endpoints engineered for structured LLM agents.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <div className="bg-surface-card border border-hairline-strong p-8 rounded-lg flex flex-col justify-between min-h-[240px] hover:bg-surface-elevated transition-colors">
                <div className="space-y-3">
                  <div className="p-2 rounded bg-surface-deep border border-hairline w-fit text-accent-orange">
                    <Terminal size={16} />
                  </div>
                  <h3 className="font-semibold text-lg text-ink font-display">Web Search API</h3>
                  <p className="text-xs text-charcoal leading-relaxed">
                    Brave, SerpAPI, and DuckDuckGo fallback orchestration. Request basic snippets or full-page HTML extractions.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-accent-blue bg-surface-deep border border-hairline px-2 py-0.5 rounded w-fit mt-4">
                  POST /v1/search
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-surface-card border border-hairline-strong p-8 rounded-lg flex flex-col justify-between min-h-[240px] hover:bg-surface-elevated transition-colors">
                <div className="space-y-3">
                  <div className="p-2 rounded bg-surface-deep border border-hairline w-fit text-accent-orange">
                    <Cpu size={16} />
                  </div>
                  <h3 className="font-semibold text-lg text-ink font-display">Content Extraction</h3>
                  <p className="text-xs text-charcoal leading-relaxed">
                    Extract readable text content from URLs with Trafilatura and headless Playwright rendering for dynamic JS-heavy websites.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-accent-blue bg-surface-deep border border-hairline px-2 py-0.5 rounded w-fit mt-4">
                  POST /v1/extract
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-surface-card border border-hairline-strong p-8 rounded-lg flex flex-col justify-between min-h-[240px] hover:bg-surface-elevated transition-colors">
                <div className="space-y-3">
                  <div className="p-2 rounded bg-surface-deep border border-hairline w-fit text-accent-orange">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="font-semibold text-lg text-ink font-display">Deep Research</h3>
                  <p className="text-xs text-charcoal leading-relaxed">
                    Execute multiple parallel search queries, normalize results, extract body text, score relevance, and synthesize comprehensive cited summaries.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-accent-blue bg-surface-deep border border-hairline px-2 py-0.5 rounded w-fit mt-4">
                  POST /v1/research
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-surface-card border border-hairline-strong p-8 rounded-lg flex flex-col justify-between min-h-[240px] hover:bg-surface-elevated transition-colors">
                <div className="space-y-3">
                  <div className="p-2 rounded bg-surface-deep border border-hairline w-fit text-accent-orange">
                    <Zap size={16} />
                  </div>
                  <h3 className="font-semibold text-lg text-ink font-display">Asynchronous Crawler</h3>
                  <p className="text-xs text-charcoal leading-relaxed">
                    Queue domain-restricted, recursive crawling jobs in background Celery workers. Retrieve full-text structures via task monitoring.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-accent-blue bg-surface-deep border border-hairline px-2 py-0.5 rounded w-fit mt-4">
                  POST /v1/crawl
                </div>
              </div>

              {/* Feature 5 */}
              <div className="bg-surface-card border border-hairline-strong p-8 rounded-lg flex flex-col justify-between min-h-[240px] hover:bg-surface-elevated transition-colors">
                <div className="space-y-3">
                  <div className="p-2 rounded bg-surface-deep border border-hairline w-fit text-accent-orange">
                    <Code size={16} />
                  </div>
                  <h3 className="font-semibold text-lg text-ink font-display">LangChain & LangGraph</h3>
                  <p className="text-xs text-charcoal leading-relaxed">
                    Drop-in SDK integrations for AI agents. Ready-to-use search and extract tools compatible with reactive agent graph nodes.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-accent-blue bg-surface-deep border border-hairline px-2 py-0.5 rounded w-fit mt-4">
                  searchmind.langchain_tool
                </div>
              </div>

              {/* Feature 6 */}
              <div className="bg-surface-card border border-hairline-strong p-8 rounded-lg flex flex-col justify-between min-h-[240px] hover:bg-surface-elevated transition-colors">
                <div className="space-y-3">
                  <div className="p-2 rounded bg-surface-deep border border-hairline w-fit text-accent-orange">
                    <Database size={16} />
                  </div>
                  <h3 className="font-semibold text-lg text-ink font-display">2-Tier Caching</h3>
                  <p className="text-xs text-charcoal leading-relaxed">
                    Leverages an ultra-fast Redis memory cache backed up by a durable Postgres cache table. Auto cache warming ensures sub-10ms response times.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-accent-blue bg-surface-deep border border-hairline px-2 py-0.5 rounded w-fit mt-4">
                  Redis + PostgreSQL
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. CODE STORY SPLIT SECTION (GLOW BLUE BACKDROP) */}
      <section className="w-full py-[96px] bg-canvas border-t border-hairline relative glow-blue">
        <div className="max-w-4xl mx-auto px-6 md:px-8 space-y-8 relative z-10">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl sm:text-4xl font-display font-medium text-ink -tracking-[0.8px]">Developer Ergonomics First</h2>
            <p className="text-sm text-mute font-mono">Import SearchMind tools into your agent pipelines in 3 lines of code.</p>
          </div>

          {/* CODE WINDOW */}
          <div className="bg-surface-deep border border-hairline-strong rounded-lg overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between bg-surface-card px-6 py-3 border-b border-hairline-strong">
              <div className="flex gap-4">
                {['python', 'langchain', 'langgraph'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCodeTab(tab)}
                    className={`flex items-center gap-1.5 text-xs font-mono font-semibold transition-all pb-1 border-b-2 capitalize ${
                      codeTab === tab 
                        ? 'text-ink border-ink' 
                        : 'text-mute border-transparent hover:text-ink'
                    }`}
                  >
                    {tab === 'python' ? 'Python SDK' : tab}
                  </button>
                ))}
              </div>
              
              {/* Traffic light chrome dots */}
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-red"></span>
                <span className="w-2 h-2 rounded-full bg-accent-yellow"></span>
                <span className="w-2 h-2 rounded-full bg-accent-green"></span>
              </div>
            </div>

            {/* Code Content */}
            <div className="p-6 text-left overflow-x-auto font-mono text-[13px] text-body leading-relaxed border-t border-hairline/25">
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
      <section id="auth-section" className="w-full py-[96px] bg-canvas border-t border-hairline">
        <div className="max-w-md mx-auto px-6 relative z-10">
          
          {token ? (
            <div className="bg-surface-card border border-hairline-strong p-8 rounded-lg space-y-6 text-center shadow-lg">
              <div className="p-4 bg-accent-green/5 border border-accent-green/20 rounded-full w-fit mx-auto text-accent-green">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold font-display text-ink">Access Authorized</h2>
              <p className="text-charcoal text-xs font-mono leading-relaxed">
                You are authenticated as <span className="text-ink font-semibold">{user?.email}</span> on the <strong className="text-accent-blue capitalize font-bold">{user?.plan}</strong> plan.
              </p>
              <Link to="/dashboard" className="button-primary w-full text-center">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="bg-surface-card border border-hairline-strong p-8 rounded-lg space-y-6 shadow-lg">
              <div className="flex justify-center border-b border-hairline-strong pb-3">
                <button
                  onClick={() => { setIsRegister(true); setError(''); }}
                  className={`flex-1 pb-2 font-mono font-semibold text-sm transition-colors ${
                    isRegister ? 'text-ink border-b-2 border-ink' : 'text-mute hover:text-ink'
                  }`}
                >
                  Register
                </button>
                <button
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className={`flex-1 pb-2 font-mono font-semibold text-sm transition-colors ${
                    !isRegister ? 'text-ink border-b-2 border-ink' : 'text-mute hover:text-ink'
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
                    <label className="text-[11px] font-mono text-mute font-bold uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      className="glass-input text-xs"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono text-mute font-bold uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    className="glass-input text-xs"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono text-mute font-bold uppercase">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="glass-input text-xs"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="button-primary w-full mt-4 font-semibold"
                >
                  {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
                </button>
              </form>
            </div>
          )}

        </div>
      </section>

      {/* 5. PRICING SECTION (GLOW RED BACKDROP) */}
      <section className="w-full py-[96px] bg-canvas border-t border-hairline relative glow-red">
        <div className="max-w-5xl mx-auto px-6 md:px-8 space-y-12 relative z-10">
          
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-display font-medium text-ink -tracking-[0.8px]">Simple, Transparent Pricing</h2>
            <p className="text-sm text-mute font-mono">Start completely free. Upgrade as your platforms and agent requests scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Free Tier */}
            <div className="bg-surface-card border border-hairline-strong p-8 rounded-lg text-left flex flex-col justify-between space-y-6 hover:bg-surface-elevated transition-colors">
              <div className="space-y-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-deep text-mute border border-hairline uppercase">FREE</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-[44px] font-extrabold font-mono text-ink">$0</span>
                  <span className="text-xs text-mute font-mono ml-1">/mo</span>
                </div>
                <p className="text-xs text-charcoal font-sans">Ideal for testing search queries and initial sandbox designs.</p>
              </div>
              <ul className="space-y-2 text-xs text-body font-mono py-4 border-t border-hairline">
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
            <div className="bg-surface-elevated border-2 border-hairline-strong p-8 rounded-lg text-left flex flex-col justify-between space-y-6 relative hover:brightness-110 transition-all shadow-glow">
              <div className="absolute top-0 right-6 -translate-y-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-ink text-canvas">
                Popular
              </div>
              <div className="space-y-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent-blue/15 text-accent-blue border border-accent-blue/20 uppercase">STARTER</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-[44px] font-extrabold font-mono text-ink">$29</span>
                  <span className="text-xs text-mute font-mono ml-1">/mo</span>
                </div>
                <p className="text-xs text-charcoal font-sans">Perfect for running autonomous agents and lightweight workflows.</p>
              </div>
              <ul className="space-y-2 text-xs text-body font-mono py-4 border-t border-hairline">
                <li className="flex items-center gap-2">✓ 10,000 requests / month</li>
                <li className="flex items-center gap-2">✓ 30 requests / minute limit</li>
                <li className="flex items-center gap-2">✓ Advanced deep full-page search</li>
                <li className="flex items-center gap-2">✓ Celery async background crawl</li>
                <li className="flex items-center gap-2">✓ LLM summary synthesis</li>
              </ul>
              <a href="#auth-section" className="button-primary w-full text-center">
                Subscribe Now
              </a>
            </div>

            {/* Pro Tier */}
            <div className="bg-surface-card border border-hairline-strong p-8 rounded-lg text-left flex flex-col justify-between space-y-6 hover:bg-surface-elevated transition-colors">
              <div className="space-y-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-deep text-mute border border-hairline uppercase">PRO</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-[44px] font-extrabold font-mono text-ink">$99</span>
                  <span className="text-xs text-mute font-mono ml-1">/mo</span>
                </div>
                <p className="text-xs text-charcoal font-sans">For scaling production pipelines, large databases, and team workflows.</p>
              </div>
              <ul className="space-y-2 text-xs text-body font-mono py-4 border-t border-hairline">
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
      <section className="w-full py-[96px] bg-canvas border-t border-hairline">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12 relative z-10">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-display font-medium text-ink -tracking-[0.8px]">Ecosystem Integration</h2>
            <p className="text-sm text-mute font-mono">SearchMind works natively with your entire development stack.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 items-center max-w-4xl mx-auto filter grayscale opacity-60 hover:filter-none hover:opacity-100 transition-all font-mono text-xs text-mute">
            {['LangChain', 'LangGraph', 'OpenAI SDK', 'NVIDIA NIM', 'Groq API', 'FastAPI', 'Neon DB', 'Redis'].map((eco) => (
              <span key={eco} className="border border-hairline bg-surface-card px-4 py-2 rounded-md">
                {eco}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 7. DOCKER UP BAND */}
      <section className="w-full py-[96px] bg-canvas border-t border-hairline">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          
          <div className="bg-surface-card border border-hairline-strong p-10 rounded-lg text-center space-y-6 relative overflow-hidden">
            <h2 className="text-3xl sm:text-4xl font-display font-medium text-ink -tracking-[0.8px]">Build your first agent search in &lt; 5 minutes.</h2>
            <p className="text-xs text-charcoal max-w-lg mx-auto font-mono">No credit card required. Free tier available. Start a local server with Docker in one command:</p>
            
            <div className="flex items-center justify-between bg-surface-deep max-w-sm mx-auto px-4 py-2.5 rounded border border-hairline-strong font-mono text-xs sm:text-sm text-accent-blue">
              <span>docker compose up --build</span>
              <button 
                onClick={handleCopyCommand}
                className="text-mute hover:text-ink transition-colors"
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
