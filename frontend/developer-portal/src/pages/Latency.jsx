import React from 'react';
import { Zap, Timer, ArrowRight, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Latency() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const traceVars = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="w-full min-h-screen bg-canvas text-ink py-20 px-6 md:px-8 relative overflow-hidden glow-red">
      <div className="max-w-5xl mx-auto space-y-16 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center space-y-6 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono tracking-[0.35px] shadow-[0_0_15px_rgba(241,90,36,0.15)]">
            <Zap size={11} className="animate-pulse" />
            <span>SUB-200ms TARGET</span>
          </div>
          <h1 className="text-display-lg text-ink">
            Asynchronous <span className="font-serif italic text-primary">Speed</span>.
          </h1>
          <p className="text-body-md text-slate leading-relaxed">
            Multi-step agent logic is notoriously slow. SearchMind counters this by executing searches, DOM fetching, parsing, and LLM formatting entirely asynchronously via FastAPI.
          </p>
        </motion.div>

        {/* Benchmarks Matrix */}
        <motion.div 
          variants={containerVars}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div variants={itemVars} whileHover={{ y: -5 }} className="card-cream border border-beige-deep p-6 text-center space-y-2 hover:border-primary/50 transition-all shadow-[0_0_20px_rgba(241,90,36,0.05)] hover:shadow-[0_0_30px_rgba(241,90,36,0.15)]">
            <h4 className="text-xs font-mono text-slate uppercase tracking-wider">Average Cache Hit</h4>
            <div className="text-4xl font-serif text-primary">12ms</div>
            <p className="text-[11px] font-mono text-steel">Redis Elasticache via gRPC</p>
          </motion.div>
          <motion.div variants={itemVars} whileHover={{ y: -5 }} className="card-cream border border-beige-deep p-6 text-center space-y-2 hover:border-primary/50 transition-all shadow-[0_0_20px_rgba(241,90,36,0.05)] hover:shadow-[0_0_30px_rgba(241,90,36,0.15)]">
            <h4 className="text-xs font-mono text-slate uppercase tracking-wider">Average Search + Snippets</h4>
            <div className="text-4xl font-serif text-ink">142ms</div>
            <p className="text-[11px] font-mono text-steel">Brave Search Edge Resolvers</p>
          </motion.div>
          <motion.div variants={itemVars} whileHover={{ y: -5 }} className="card-cream border border-beige-deep p-6 text-center space-y-2 hover:border-primary/50 transition-all shadow-[0_0_20px_rgba(241,90,36,0.05)] hover:shadow-[0_0_30px_rgba(241,90,36,0.15)]">
            <h4 className="text-xs font-mono text-slate uppercase tracking-wider">Deep Extract (3 URLs)</h4>
            <div className="text-4xl font-serif text-ink">850ms</div>
            <p className="text-[11px] font-mono text-steel">Asyncio HTTPX pipeline</p>
          </motion.div>
        </motion.div>

        {/* Timeline Visualization */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-surface-code rounded-xl p-8 border border-white/10 space-y-6 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle gradient overlay in timeline */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-blue/5 pointer-events-none"></div>

          <div className="flex items-center gap-2 text-white border-b border-white/10 pb-4 relative z-10">
            <Gauge size={18} className="text-primary" />
            <h3 className="text-sm font-mono font-bold">Concurrency Pipeline Trace</h3>
          </div>
          
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-4 font-mono text-xs text-white/80 relative z-10"
          >
            <motion.div variants={traceVars} className="flex items-center gap-4 group">
              <div className="w-24 text-primary group-hover:text-white transition-colors">0ms</div>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} whileInView={{ width: "5%" }} transition={{ duration: 1 }} className="h-full bg-primary/60 rounded-full shadow-[0_0_10px_rgba(241,90,36,0.5)]"></motion.div>
              </div>
              <div className="w-48 text-right group-hover:text-primary transition-colors">API Request Received</div>
            </motion.div>
            
            <motion.div variants={traceVars} className="flex items-center gap-4 group">
              <div className="w-24 text-primary group-hover:text-white transition-colors">25ms</div>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} whileInView={{ width: "20%" }} transition={{ duration: 1, delay: 0.1 }} className="h-full bg-accent-yellow/60 rounded-full shadow-[0_0_10px_rgba(255,183,0,0.5)]"></motion.div>
              </div>
              <div className="w-48 text-right group-hover:text-accent-yellow transition-colors">Provider Search Resolution</div>
            </motion.div>

            <motion.div variants={traceVars} className="flex items-center gap-4 group">
              <div className="w-24 text-primary group-hover:text-white transition-colors">150ms</div>
              <div className="flex-1 h-2 bg-white/10 rounded-full relative">
                <motion.div initial={{ width: 0 }} whileInView={{ width: "60%" }} transition={{ duration: 1.5, delay: 0.2 }} className="absolute top-0 left-[20%] h-full bg-accent-green/60 rounded-full shadow-[0_0_10px_rgba(0,255,136,0.5)]"></motion.div>
              </div>
              <div className="w-48 text-right group-hover:text-accent-green transition-colors">Concurrent URL Fetching (HTTPX)</div>
            </motion.div>

            <motion.div variants={traceVars} className="flex items-center gap-4 group">
              <div className="w-24 text-primary group-hover:text-white transition-colors">600ms</div>
              <div className="flex-1 h-2 bg-white/10 rounded-full relative">
                <motion.div initial={{ width: 0 }} whileInView={{ width: "15%" }} transition={{ duration: 0.8, delay: 0.5 }} className="absolute top-0 left-[80%] h-full bg-accent-blue/60 rounded-full shadow-[0_0_10px_rgba(0,183,255,0.5)]"></motion.div>
              </div>
              <div className="w-48 text-right group-hover:text-accent-blue transition-colors">Trafilatura DOM Parsing</div>
            </motion.div>

            <motion.div variants={traceVars} className="flex items-center gap-4 group">
              <div className="w-24 text-primary group-hover:text-white transition-colors">850ms</div>
              <div className="flex-1 h-2 bg-white/10 rounded-full relative">
                <motion.div initial={{ width: 0 }} whileInView={{ width: "5%" }} transition={{ duration: 0.5, delay: 0.8 }} className="absolute top-0 left-[95%] h-full bg-white/60 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></motion.div>
              </div>
              <div className="w-48 text-right group-hover:text-white transition-colors">JSON Assembly & Dispatch</div>
            </motion.div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
