import React from 'react';
import { Cpu, Database, Code, ShieldCheck, Zap, Layers, Server, Compass, MousePointerClick, Highlighter, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Features() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="w-full min-h-screen bg-canvas text-ink py-20 px-6 md:px-8 relative overflow-hidden glow-red">
      {/* Background Orbs */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"
      />

      <div className="max-w-6xl mx-auto space-y-20 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center space-y-6 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono tracking-[0.35px] shadow-[0_0_15px_rgba(241,90,36,0.15)]">
            <Cpu size={11} />
            <span>CORE ARCHITECTURE & AUTONOMOUS PRIMITIVES</span>
          </div>
          <h1 className="text-display-lg text-ink">
            Engineered for <span className="font-serif italic text-primary">Autonomous Agents</span>.
          </h1>
          <p className="text-body-md text-slate leading-relaxed">
            Unlike standard consumer search APIs, SearchMind is designed specifically to feed clean, structured, and syntactically flawless data directly into LLM context windows with zero token waste.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVars}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Feature 1 */}
          <motion.div variants={itemVars} whileHover={{ scale: 1.02, y: -4 }} className="card-base p-7 space-y-5 hover:border-primary/30 transition-all duration-300">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(241,90,36,0.2)]">
              <Highlighter size={22} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-heading-4 text-ink">Dynamic Passage Highlights</h3>
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">NEW</span>
              </div>
              <p className="text-body-sm text-slate leading-relaxed mb-4">
                Condenses entire pages into high-density relevance passages matching query semantics, shrinking LLM prompt context requirements by up to 80%.
              </p>
              <div className="bg-surface-code p-3 rounded border border-hairline font-mono text-[11px] text-white/80 shadow-inner">
                {'{'}<br/>
                &nbsp;&nbsp;"highlights": [<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"FastAPI async workers scale...",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"Dependency injection handles..."<br/>
                &nbsp;&nbsp;]<br/>
                {'}'}
              </div>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div variants={itemVars} whileHover={{ scale: 1.02, y: -4 }} className="card-base p-7 space-y-5 hover:border-primary/30 transition-all duration-300">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(241,90,36,0.2)]">
              <Code2 size={22} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-heading-4 text-ink">Schema-Driven Extraction</h3>
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">NEW</span>
              </div>
              <p className="text-body-sm text-slate leading-relaxed mb-4">
                Extracts strictly typed JSON data directly conforming to a client-supplied JSON Schema definition from live URLs with validation error reporting.
              </p>
              <div className="bg-surface-code p-3 rounded border border-hairline font-mono text-[11px] text-white/80 shadow-inner">
                {'{'}<br/>
                &nbsp;&nbsp;"validation_status": <span className="text-accent-green">"valid"</span>,<br/>
                &nbsp;&nbsp;"data": {'{'} "price": 49.00, "in_stock": true {'}'}<br/>
                {'}'}
              </div>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div variants={itemVars} whileHover={{ scale: 1.02, y: -4 }} className="card-base p-7 space-y-5 hover:border-primary/30 transition-all duration-300">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(241,90,36,0.2)]">
              <Compass size={22} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-heading-4 text-ink">Topological Site Mapping</h3>
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">NEW</span>
              </div>
              <p className="text-body-sm text-slate leading-relaxed mb-4">
                Discovers the complete URL topology of a site instantly via robots.txt, multi-tier sitemaps, and gzip decompression without brute-force spidering.
              </p>
              <div className="bg-surface-code p-3 rounded border border-hairline font-mono text-[11px] text-white/80 shadow-inner">
                {'{'}<br/>
                &nbsp;&nbsp;"total_links": <span className="text-accent-yellow">3420</span>,<br/>
                &nbsp;&nbsp;"sitemap_found": <span className="text-accent-green">true</span>,<br/>
                &nbsp;&nbsp;"execution_time_ms": <span className="text-accent-blue">210</span><br/>
                {'}'}
              </div>
            </div>
          </motion.div>

          {/* Feature 4 */}
          <motion.div variants={itemVars} whileHover={{ scale: 1.02, y: -4 }} className="card-base p-7 space-y-5 hover:border-primary/30 transition-all duration-300">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(241,90,36,0.2)]">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-heading-4 text-ink">Stateful Browser Sessions</h3>
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">NEW</span>
              </div>
              <p className="text-body-sm text-slate leading-relaxed mb-4">
                Maintains persistent headless browser instances with an isolated cookie vault. Enables agents to login once and execute multi-turn authenticated workflows.
              </p>
              <ul className="space-y-1.5 text-[11px] font-mono text-slate">
                <li className="flex items-center gap-2"><ShieldCheck size={12} className="text-accent-green"/> Isolated Cookie Vault</li>
                <li className="flex items-center gap-2"><ShieldCheck size={12} className="text-accent-green"/> Auto-Lease Reclaiming</li>
                <li className="flex items-center gap-2"><ShieldCheck size={12} className="text-accent-green"/> State Preservation</li>
              </ul>
            </div>
          </motion.div>

          {/* Feature 5 */}
          <motion.div variants={itemVars} whileHover={{ scale: 1.02, y: -4 }} className="card-base p-7 space-y-5 hover:border-primary/30 transition-all duration-300">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(241,90,36,0.2)]">
              <MousePointerClick size={22} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-heading-4 text-ink">Natural Language Actions</h3>
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">NEW</span>
              </div>
              <p className="text-body-sm text-slate leading-relaxed mb-4">
                Turns instructions like "Click the login button and enter email" into semantic actions grounded over ARIA accessibility trees with self-healing DOM retry loops.
              </p>
              <ul className="space-y-1.5 text-[11px] font-mono text-slate">
                <li className="flex items-center gap-2"><ShieldCheck size={12} className="text-accent-green"/> No fragile XPath/CSS selectors</li>
                <li className="flex items-center gap-2"><ShieldCheck size={12} className="text-accent-green"/> ARIA Tree Semantic Grounding</li>
                <li className="flex items-center gap-2"><ShieldCheck size={12} className="text-accent-green"/> Mutation Verification</li>
              </ul>
            </div>
          </motion.div>

          {/* Feature 6 */}
          <motion.div variants={itemVars} whileHover={{ scale: 1.02, y: -4 }} className="card-base p-7 space-y-5 hover:border-primary/30 transition-all duration-300">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(241,90,36,0.2)]">
              <Database size={22} />
            </div>
            <div>
              <h3 className="text-heading-4 text-ink mb-2">Semantic Deduplication & Caching</h3>
              <p className="text-body-sm text-slate leading-relaxed mb-4">
                Dual-tier caching (Redis memory + Postgres warm store) paired with cosine embedding similarity to eliminate duplicate content before context injection.
              </p>
              <div className="bg-surface-code p-3 rounded border border-hairline font-mono text-[11px] text-white/80 shadow-inner">
                <span className="text-primary">similarity</span> = cosine(emb_a, emb_b)<br/>
                <span className="text-accent-red">if</span> similarity &gt; <span className="text-accent-green">0.92</span>: drop_duplicate()
              </div>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
