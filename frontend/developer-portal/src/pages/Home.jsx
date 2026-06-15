import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Terminal, Key, ShieldCheck, Cpu, Code, CheckCircle, Sparkles, Database, Zap, Copy, ArrowRight, Play, Server, AlertCircle, HelpCircle } from 'lucide-react'
import OrbitImages from '../components/OrbitImages.jsx'
import PixelBlast from '../components/PixelBlast.jsx'

const techStack = [
  { name: 'LangChain', url: 'https://cdn.simpleicons.org/langchain/white' },
  { name: 'LangGraph', url: 'https://cdn.simpleicons.org/langgraph/white' },
  { name: 'OpenAI', url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg' },
  { name: 'NVIDIA', url: 'https://cdn.simpleicons.org/nvidia/white' },
  { name: 'Groq', url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/groq.svg' },
  { name: 'FastAPI', url: 'https://cdn.simpleicons.org/fastapi/white' },
  { name: 'Neon DB', url: 'https://cdn.simpleicons.org/neon/white' },
  { name: 'Redis', url: 'https://cdn.simpleicons.org/redis/white' }
]

const orbitTechItems = techStack.map((tech) => {
  const needsScale = tech.name === 'Groq' || tech.name === 'OpenAI';
  return (
    <div
      key={tech.name}
      className="w-full h-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group cursor-pointer"
      title={tech.name}
    >
      <img
        src={tech.url}
        alt={tech.name}
        className={`w-full h-full object-contain opacity-75 group-hover:opacity-100 transition-opacity ${needsScale ? 'filter brightness-0 invert scale-[5.0]' : ''}`}
        onError={(e) => {
          e.target.style.display = 'none';
          const span = document.createElement('span');
          span.className = "text-[11px] font-bold text-slate uppercase tracking-tighter font-sans";
          span.innerText = tech.name.substring(0, 3);
          e.target.parentNode.appendChild(span);
        }}
      />
    </div>
  );
})

export default function Home({ token }) {
  const [codeTab, setCodeTab] = useState('python')

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

  const [copiedTerminal, setCopiedTerminal] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedDocker, setCopiedDocker] = useState(false)

  const handleCopyDocker = () => {
    navigator.clipboard.writeText("docker compose up --build")
    setCopiedDocker(true)
    setTimeout(() => setCopiedDocker(false), 2000)
  }

  const handleCopyTerminal = () => {
    const curlCommand = `curl -X POST https://api.searchmind.dev/v1/search \\
  -H "X-API-Key: sm_live_d8a3...9f2a" \\
  -d '{"query": "LangGraph multi-agent systems 2026", "depth": "advanced"}'`;
    navigator.clipboard.writeText(curlCommand)
    setCopiedTerminal(true)
    setTimeout(() => setCopiedTerminal(false), 2000)
  }

  const handleCopyCode = () => {
    const textToCopy = codeTab === 'python' ? pythonCode : codeTab === 'langchain' ? langchainCode : langgraphCode;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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
      <section className="w-full hero-band-sunset relative py-20 md:py-32 flex justify-center border-b border-hairline overflow-hidden">
        {/* PixelBlast Interactive Background */}
        <div className="absolute inset-0 z-0">
          <PixelBlast
            variant="square"
            pixelSize={4}
            color="#F15A24"
            patternScale={2}
            patternDensity={1}
            pixelSizeJitter={0}
            enableRipples={true}
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            liquid={false}
            speed={0.5}
            edgeFade={0.25}
            transparent={true}
          />
        </div>

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
              <span>BETA</span>
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
                <Link to="/auth?mode=register" className="button-dark font-semibold px-6">
                  Start for Free
                  <ArrowRight size={14} className="ml-2" />
                </Link>
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
                <div className="flex gap-1.5 w-16">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-red opacity-80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-yellow opacity-80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-green opacity-80"></span>
                </div>
                <span className="text-[11px] font-mono text-on-dark-muted">curl_terminal.sh</span>
                <div className="w-16 flex justify-end">
                  <button
                    onClick={handleCopyTerminal}
                    className="flex items-center gap-1.5 text-[10px] text-on-dark-muted hover:text-white transition-colors uppercase font-bold tracking-wider"
                    title="Copy command"
                  >
                    {copiedTerminal ? <CheckCircle size={12} className="text-accent-green" /> : <Copy size={12} />}
                    {copiedTerminal ? 'Copied' : 'Copy'}
                  </button>
                </div>
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
                    className={`flex items-center gap-1.5 text-xs font-mono font-bold transition-all pb-1.5 border-b-2 capitalize ${codeTab === tab
                      ? 'text-white border-primary'
                      : 'text-on-dark-muted border-transparent hover:text-white'
                      }`}
                  >
                    {tab === 'python' ? 'Python SDK' : tab}
                  </button>
                ))}
              </div>

              {/* Traffic light chrome dots and Copy button */}
              <div className="flex items-center gap-6">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 text-xs text-on-dark-muted hover:text-white transition-colors"
                >
                  {copiedCode ? <CheckCircle size={14} className="text-accent-green" /> : <Copy size={14} />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-red opacity-80"></span>
                  <span className="w-2 h-2 rounded-full bg-accent-yellow opacity-80"></span>
                  <span className="w-2 h-2 rounded-full bg-accent-green opacity-80"></span>
                </div>
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




      {/* 6. ECOSYSTEM INTEGRATION */}
      <section className="w-full py-24 bg-canvas border-t border-hairline overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12 relative z-10">
          <div className="space-y-3">
            <h2 className="text-heading-2 text-ink">Ecosystem Integration</h2>
            <p className="text-body-md text-slate">SearchMind works natively with your entire development stack.</p>
          </div>

          <div className="w-full max-w-3xl mx-auto mt-6 flex justify-center items-center overflow-visible select-none">
            <OrbitImages
              images={orbitTechItems}
              shape="ellipse"
              radiusX={550}
              radiusY={130}
              rotation={-6}
              duration={30}
              itemSize={72}
              responsive={true}
              radius={180}
              direction="normal"
              fill={true}
              showPath={true}
              pathColor="rgba(255, 255, 255, 0.06)"
              pathWidth={1.5}
              height="360px"
              centerContent={
                <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl border border-primary/20 flex items-center justify-center shadow-[0_0_45px_rgba(241,90,36,0.22)] overflow-hidden">
                  <img src="/logo-dark.png" alt="SearchMind API" className="w-full h-full object-contain" />
                </div>
              }
            />
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
                onClick={handleCopyDocker}
                className="text-steel hover:text-primary transition-colors"
                title="Copy Command"
              >
                {copiedDocker ? <span className="text-[10px] text-accent-green font-bold">Copied!</span> : <Copy size={13} />}
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}
