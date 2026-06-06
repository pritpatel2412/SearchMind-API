import React from 'react';
import { ShieldCheck, Activity, Globe, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Reliability() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="w-full min-h-screen bg-canvas text-ink py-20 px-6 md:px-8 relative overflow-hidden">
      
      <div className="max-w-5xl mx-auto space-y-16 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center space-y-6 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono tracking-[0.35px] shadow-[0_0_15px_rgba(241,90,36,0.15)]">
            <ShieldCheck size={11} />
            <span>99.99% TARGET SLA</span>
          </div>
          <h1 className="text-display-lg text-ink">
            Unbreakable <span className="font-serif italic text-primary">Cascading Fallbacks</span>.
          </h1>
          <p className="text-body-md text-slate leading-relaxed">
            Agent loops fail when external APIs timeout. SearchMind guarantees query success by instantly routing requests across multiple independent search engine backbones in the event of rate limits or catastrophic provider failure.
          </p>
        </motion.div>

        {/* Architecture Diagram Simulation */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="bg-cream border border-beige-deep rounded-xl p-8 shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-primary/30 transition-colors duration-500"
        >
          <h3 className="text-heading-4 mb-6 text-ink font-mono uppercase tracking-wider text-sm border-b border-hairline pb-4">Resolver Architecture</h3>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-full bg-surface-code text-white flex items-center justify-center font-bold font-mono shadow-lg border border-white/10">APP</div>
              <span className="text-xs font-mono text-slate">Client Request</span>
            </motion.div>
            
            <Globe className="text-primary opacity-50 hidden md:block animate-pulse" size={24} />
            
            <motion.div 
              variants={containerVars}
              initial="hidden"
              animate="show"
              className="flex-1 space-y-4 w-full"
            >
              {/* Primary */}
              <motion.div variants={itemVars} className="relative border border-primary/40 bg-primary/10 rounded-lg p-4 flex items-center justify-between shadow-[0_0_15px_rgba(241,90,36,0.15)] hover:bg-primary/20 transition-colors cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
                  <span className="font-mono text-sm text-ink font-bold">Tier 1: Brave Search API</span>
                </div>
                <span className="text-[10px] font-mono text-primary bg-cream-deeper px-2 py-1 rounded font-bold">Primary Index</span>
              </motion.div>
              
              {/* Secondary */}
              <motion.div variants={itemVars} className="relative border border-hairline bg-cream-soft rounded-lg p-4 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent-yellow"></div>
                  <span className="font-mono text-sm text-ink font-bold">Tier 2: SerpAPI Google</span>
                </div>
                <span className="text-[10px] font-mono text-slate bg-cream px-2 py-1 rounded">Fallback (Timeout &gt; 500ms)</span>
              </motion.div>

              {/* Tertiary */}
              <motion.div variants={itemVars} className="relative border border-hairline bg-cream-soft rounded-lg p-4 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent-red"></div>
                  <span className="font-mono text-sm text-ink font-bold">Tier 3: DuckDuckGo HTML</span>
                </div>
                <span className="text-[10px] font-mono text-slate bg-cream px-2 py-1 rounded">Last Resort</span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div className="space-y-4 group">
            <Activity className="text-primary mb-2 group-hover:scale-110 transition-transform" size={28} />
            <h3 className="text-heading-3 text-ink group-hover:text-primary transition-colors">Circuit Breaker Pattern</h3>
            <p className="text-body-sm text-slate leading-relaxed">
              Implemented directly into our FastAPI backend, circuit breakers automatically halt traffic to struggling providers, maintaining low latency bounds while allowing the provider time to recover without overwhelming active connections.
            </p>
          </div>
          <div className="space-y-4 group">
            <RefreshCcw className="text-primary mb-2 group-hover:scale-110 transition-transform" size={28} />
            <h3 className="text-heading-3 text-ink group-hover:text-primary transition-colors">Asynchronous Retry Queues</h3>
            <p className="text-body-sm text-slate leading-relaxed">
              Using Celery clusters, long-running extraction jobs on heavy DOM payloads are queued and retried asynchronously with exponential backoff, ensuring web scraping jobs complete reliably even against strict WAFs.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
