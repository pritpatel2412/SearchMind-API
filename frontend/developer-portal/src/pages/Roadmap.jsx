import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Activity, Clock, Sparkles, Compass, Terminal, Cpu, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const timelineEvents = [
  {
    phase: "Phase 1: Core Foundation",
    date: "February 2026",
    status: "completed",
    title: "FastAPI Search Orchestrator",
    description: "Built the asynchronous FastAPI backend engine, mapping user authentication via cryptographically secure SHA-256 API key verification. Integrated the multi-provider search fallback chain (Brave Search -> SerpAPI -> DuckDuckGo) to ensure high search availability.",
    bullets: [
      "Asynchronous database engine using SQLAlchemy AsyncIO.",
      "Three-tier search fallback sequence.",
      "API Key CRUD lifecycle management."
    ]
  },
  {
    phase: "Phase 2: Clean Content & Caching",
    date: "March 2026",
    status: "completed",
    title: "Two-Tier Cache & Headless Crawling",
    description: "Constructed the primary performance layers. Built a dual-tier cache (Redis for hot memory, PostgreSQL for durable warm storage). Integrated Trafilatura and Readability for semantic text extraction, with a headless Playwright Chromium worker fallback to scrape dynamic Javascript single-page apps.",
    bullets: [
      "Dual-tier cache lookup (sub-10ms Redis hits).",
      "Playwright chromium dynamic DOM rendering.",
      "Exclusion heuristic filter database for spam domains."
    ]
  },
  {
    phase: "Phase 3: Deep Research Loops & SDKs",
    date: "April 2026",
    status: "completed",
    title: "Parallel Agents & LangGraph Adapters",
    description: "Developed deep research loops parallelizing multiple sub-queries concurrently using asyncio.gather. Released the searchmind Python SDK featuring native adapters that expose StructuredTool parameters optimized specifically for LangGraph and LangChain agent nodes.",
    bullets: [
      "Parallelized sub-query scraping and re-ranking.",
      "Custom score heuristics based on term overlap and credibility.",
      "SearchMind SDK release on PyPI."
    ]
  },
  {
    phase: "Phase 4: Telemetry & Observability",
    date: "June 2026",
    status: "completed",
    title: "Admin Observability & Analytics Overlay",
    description: "Completed comprehensive observability layers. Implemented interactive SVG sparkline analytics, real-time db/cache health endpoints, client-side browser telemetry trackers (resolution, timezone, locale), and a Vercel-style telemetry overlay modal. Integrated a cinematic Canyon Parallax 404 redirect handler.",
    bullets: [
      "Client telemetry collection & GeoIP integration.",
      "Vercel-style User Session Analytics dashboard.",
      "Cinematic desert canyon 404 page."
    ]
  },
  {
    phase: "Phase 5: Autonomous Agent Primitives",
    date: "Q3–Q4 2026",
    status: "completed",
    title: "Next-Gen Autonomous Agent Web Primitives",
    description: "Engineered and deployed 5 groundbreaking primitives purpose-built for LLM reasoning loops. Eliminates token waste and enables robust multi-turn autonomous interaction on the live web.",
    bullets: [
      "Dynamic Query-Conditioned Highlights (/v1/search & /v1/extract): relevance-scored sentence extracts that shrink context windows by up to 80%.",
      "Zero-Token Schema-Driven Extraction (/v1/extract/schema): strict JSON Schema enforcement directly from HTML with type coercion and validation reporting.",
      "Zero-Crawl Topological Site Mapping (/v1/map): instant sitemap resolution, gzip decompression, and topical regex filtering without spidering overhead.",
      "Persistent Browser Sessions & Cookie Vault (/v1/sessions): stateful browser sessions with isolated cookie vaults for seamless authenticated agent workflows.",
      "Natural Language Web Actions (/v1/action/instruct): semantic grounding over ARIA accessibility trees with mutation-verified self-healing retries."
    ]
  },
  {
    phase: "Phase 6: Multi-Tenant Workspaces",
    date: "Late 2026",
    status: "current",
    title: "Organizations, Scoped Keys & Metered Billing",
    description: "Currently expanding SearchMind to support enterprise collaborative workflows. Introducing shared developer workspaces, team organizations, custom domain routing, granular API key access control scopes (read-only, extract-only, session-admin), and Stripe metered usage billing.",
    bullets: [
      "Team organizations and shared API key vaults.",
      "Granular key permissions (search-only, schema-extract, full-session-control).",
      "Stripe metered billing usage cycles & webhook reconciliation."
    ]
  },
  {
    phase: "Phase 7: Distributed Edge Crawlers",
    date: "2027",
    status: "future",
    title: "Global Edge Nodes & Cognitive Graph Synthesis",
    description: "Deploying multi-region edge browser workers across 30+ cloud locations for sub-50ms regional web scraping, coupled with automated cross-document knowledge graph generation directly embedded into agent vector spaces.",
    bullets: [
      "Worldwide geo-distributed headless edge workers.",
      "Cross-document entity graph synthesis.",
      "Automated speculative prefetching for anticipated sub-agent queries."
    ]
  }
];

export default function Roadmap() {
  return (
    <div className="min-h-screen bg-canvas text-ink relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden">
      
      {/* Background radial accent glow */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-blue/5 blur-[100px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-16">
        
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-left space-y-4 max-w-2xl"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono tracking-wider uppercase animate-pulse">
            <Compass size={11} className="text-primary" />
            <span>SearchMind Progress & Roadmap</span>
          </div>
          <h1 className="text-display-lg text-ink font-light leading-tight font-display">
            The Journey of <span className="font-serif italic text-primary">SearchMind</span>
          </h1>
          <p className="text-body-md text-slate leading-relaxed">
            Standard search engines are engineered for human eyes. SearchMind was conceived to solve the agentic gap: providing structured, low-latency, sanitized markdown context optimized specifically for LLM reasoning loops.
          </p>
        </motion.div>

        {/* Sunset stripe divider */}
        <motion.div 
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="w-full sunset-stripe-band rounded-full origin-left" 
        />

        {/* History / Thinking Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start"
        >
          <div className="md:col-span-1 space-y-2 text-left">
            <h3 className="text-heading-4 text-ink font-semibold">The Thinking</h3>
            <p className="text-xs text-steel font-mono">Origins & Philosophy</p>
          </div>
          <div className="md:col-span-2 text-left space-y-4">
            <p className="text-body-sm text-slate leading-relaxed">
              When autonomous agent loops (like LangGraph and AutoGen) run online web search, they are usually fed cluttered HTML pages bloated with scripts, tracking cookies, and SEO-optimized paragraphs. This consumes massive context windows, inflates prompt costs, and degrades decision speeds.
            </p>
            <p className="text-body-sm text-slate leading-relaxed">
              SearchMind was built to serve as a high-speed proxy layer that queries, fetches, renders, cleans, extracts schemas, and navigates web content, returning ready-to-use markdown snippets and validated structured objects to agents in milliseconds.
            </p>
          </div>
        </motion.div>

        <div className="border-t border-hairline my-12" />

        {/* Vertical Parallax-Style Timeline */}
        <div className="space-y-12 relative text-left">
          
          {/* Central timeline track line */}
          <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-[1px] bg-hairline-strong pointer-events-none transform -translate-x-1/2"></div>

          {timelineEvents.map((event, idx) => {
            const isLeft = idx % 2 === 0;
            const isCompleted = event.status === "completed";
            const isCurrent = event.status === "current";

            return (
              <div 
                key={event.phase} 
                className={`relative flex flex-col md:flex-row items-stretch gap-8 md:gap-0 ${
                  isLeft ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Timeline node dot wrapper */}
                <div className="absolute left-6 md:left-1/2 top-6 w-8 h-8 transform -translate-x-1/2 z-20 flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.1 }}
                    className="w-full h-full rounded-full bg-cream border border-beige-deep flex items-center justify-center"
                  >
                    {isCompleted && <CheckCircle2 size={14} className="text-accent-green" />}
                    {isCurrent && <Activity size={14} className="text-primary animate-pulse" />}
                    {!isCompleted && !isCurrent && <Clock size={14} className="text-steel" />}
                  </motion.div>
                </div>

                {/* Card side */}
                <div 
                  className={`w-full md:w-1/2 pl-14 pr-4 py-0 ${
                    isLeft ? 'md:pl-12 md:pr-0' : 'md:pr-12 md:pl-0'
                  }`}
                >
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ type: "spring", stiffness: 70, damping: 15 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className={`card-base p-6 hover:border-primary/50 transition-all duration-300 relative cursor-default ${
                      isCurrent ? 'border-primary/30 shadow-[0_0_15px_rgba(241,90,36,0.05)] bg-cream-soft/20' : ''
                    }`}
                  >
                    
                    {/* Status Badge */}
                    <div className="flex justify-between items-center gap-2 mb-3">
                      <span className="text-[10px] font-mono text-steel uppercase font-bold tracking-wider">{event.phase}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                        isCompleted ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' :
                        isCurrent ? 'bg-primary/10 text-primary border border-primary/20 animate-pulse' :
                        'bg-cream text-slate border border-beige-deep'
                      }`}>
                        {event.status}
                      </span>
                    </div>

                    <h4 className="text-heading-5 text-ink font-semibold flex items-center gap-2">
                      {event.title}
                    </h4>
                    
                    <p className="text-micro text-steel font-mono mt-1.5">{event.date}</p>
                    
                    <p className="text-body-sm text-slate mt-4 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Bullet Highlights */}
                    <div className="mt-4 pt-4 border-t border-hairline space-y-2">
                      {event.bullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] font-mono text-slate">
                          <span className="text-primary mt-0.5">&gt;</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                  </motion.div>
                </div>

                {/* Spacer side */}
                <div className="hidden md:block w-1/2"></div>
              </div>
            );
          })}

        </div>

        <div className="border-t border-hairline my-12" />

        {/* Footer CTA Callout */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="card-cream p-8 text-center space-y-4 relative overflow-hidden rounded-xl border border-beige-deep bg-cream/40"
        >
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(241,90,36,0.03)_0%,transparent_50%)] pointer-events-none"></div>
          <Sparkles size={24} className="text-primary mx-auto animate-pulse" />
          <h3 className="text-heading-3 text-ink font-semibold">Integrate SearchMind into Your Stack</h3>
          <p className="text-body-sm text-slate max-w-lg mx-auto leading-relaxed">
            Ready to plug our optimized agent web search and action layer into your LangGraph, AutoGen, or custom RAG architecture? Generate your free client credentials today.
          </p>
          <div className="pt-4 flex justify-center">
            <Link 
              to="/auth?mode=register" 
              className="button-primary font-semibold text-xs tracking-wider uppercase h-[42px] px-6 flex items-center gap-2"
            >
              Start Free Lifetime Trial
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
