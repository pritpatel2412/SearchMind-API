import React from 'react';
import { Cpu, Database, Code, ShieldCheck, Zap, Layers, Server } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Features() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
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
            <span>CORE ARCHITECTURE</span>
          </div>
          <h1 className="text-display-lg text-ink">
            Engineered for <span className="font-serif italic text-primary">Autonomous Agents</span>.
          </h1>
          <p className="text-body-md text-slate leading-relaxed">
            Unlike standard consumer search APIs, SearchMind is designed specifically to feed clean, structured, and syntactically flawless data directly into LLM context windows.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVars}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Feature 1 */}
          <motion.div variants={itemVars} whileHover={{ scale: 1.02, y: -5 }} className="card-base p-8 space-y-6 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(241,90,36,0.08)]">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(241,90,36,0.2)]">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-heading-3 mb-3 text-ink group-hover:text-primary transition-colors">Trafilatura DOM Extraction</h3>
              <p className="text-body-sm text-slate leading-relaxed mb-4">
                We utilize an aggressive DOM parsing pipeline powered by Trafilatura to extract pure article text, completely ignoring navigation menus, sidebars, cookie banners, and ads.
              </p>
              <div className="bg-surface-code p-4 rounded border border-hairline font-mono text-xs text-white/80 shadow-inner">
                // Raw payload to LLM context<br/>
                {'{'}<br/>
                &nbsp;&nbsp;"content_density": <span className="text-accent-green">0.94</span>,<br/>
                &nbsp;&nbsp;"clean_markdown": <span className="text-accent-yellow">"Multi-agent systems..."</span>,<br/>
                &nbsp;&nbsp;"token_count": <span className="text-accent-green">842</span><br/>
                {'}'}
              </div>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div variants={itemVars} whileHover={{ scale: 1.02, y: -5 }} className="card-base p-8 space-y-6 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(241,90,36,0.08)]">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(241,90,36,0.2)]">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-heading-3 mb-3 text-ink">Semantic Deduplication</h3>
              <p className="text-body-sm text-slate leading-relaxed mb-4">
                Redundant results across different search providers are actively pruned via embedding similarities, guaranteeing maximum information density in the shortest amount of context tokens.
              </p>
              <div className="bg-surface-code p-4 rounded border border-hairline font-mono text-xs text-white/80 shadow-inner">
                <span className="text-primary">similarity_score</span> = cosine(emb(url_a), emb(url_b))<br/>
                <span className="text-accent-red">if</span> similarity_score &gt; <span className="text-accent-green">0.92</span>:<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;merge_results(url_a, url_b)
              </div>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div variants={itemVars} whileHover={{ scale: 1.02, y: -5 }} className="card-base p-8 space-y-6 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(241,90,36,0.08)]">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(241,90,36,0.2)]">
              <Server size={24} />
            </div>
            <div>
              <h3 className="text-heading-3 mb-3 text-ink">Headless Browser Fallback</h3>
              <p className="text-body-sm text-slate leading-relaxed mb-4">
                For Single Page Applications (SPAs) or highly dynamic React/Vue sites, the crawler gracefully escalates from standard HTTP requests to full Playwright-driven headless browsing.
              </p>
              <ul className="space-y-3 text-xs font-mono text-slate">
                <li className="flex items-center gap-3"><ShieldCheck size={14} className="text-accent-green"/> Executes JavaScript bundles</li>
                <li className="flex items-center gap-3"><ShieldCheck size={14} className="text-accent-green"/> Bypasses basic Cloudflare challenges</li>
                <li className="flex items-center gap-3"><ShieldCheck size={14} className="text-accent-green"/> Waits for network-idle state</li>
              </ul>
            </div>
          </motion.div>

          {/* Feature 4 */}
          <motion.div variants={itemVars} whileHover={{ scale: 1.02, y: -5 }} className="card-base p-8 space-y-6 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(241,90,36,0.08)]">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(241,90,36,0.2)]">
              <Code size={24} />
            </div>
            <div>
              <h3 className="text-heading-3 mb-3 text-ink">Structured Output Formatting</h3>
              <p className="text-body-sm text-slate leading-relaxed">
                By natively returning highly-structured JSON and Markdown, SearchMind prevents prompt-injection risks from scraped text and reduces LLM hallucination rates by providing strict boundaries around the retrieved information blocks.
              </p>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
