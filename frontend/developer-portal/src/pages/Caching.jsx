import React from 'react';
import { Database, Clock, Lock, Server } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Caching() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
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
            <Database size={11} className="animate-pulse" />
            <span>DUAL-TIER MEMORY</span>
          </div>
          <h1 className="text-display-lg text-ink">
            Semantic <span className="font-serif italic text-primary">Caching Layer</span>.
          </h1>
          <p className="text-body-md text-slate leading-relaxed">
            Stop paying for redundant searches. SearchMind employs a dual-tier cache strategy using Redis and PostgreSQL, bypassing rate limits and drastically cutting down latency for recurring queries.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVars}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <motion.div variants={itemVars} whileHover={{ scale: 1.02 }} className="card-base p-8 space-y-6 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(241,90,36,0.1)] group">
            <h3 className="text-heading-3 text-ink group-hover:text-primary transition-colors">Tier 1: Redis In-Memory</h3>
            <p className="text-body-sm text-slate leading-relaxed">
              Extremely hot queries (like news topics or trending data) are served directly from an Elasticache Redis cluster via an exact-match hash. Response time drops to ~12ms.
            </p>
            <div className="bg-surface-code p-4 rounded border border-hairline font-mono text-xs text-white/80 shadow-inner">
              <span className="text-slate italic"># Redis TTL Configuration</span><br/>
              <span className="text-primary">default_ttl</span> = <span className="text-accent-green">3600</span>  <span className="text-slate italic"># 1 Hour</span><br/>
              <span className="text-primary">news_ttl</span> = <span className="text-accent-green">300</span>      <span className="text-slate italic"># 5 Minutes</span><br/>
            </div>
          </motion.div>

          <motion.div variants={itemVars} whileHover={{ scale: 1.02 }} className="card-base p-8 space-y-6 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(241,90,36,0.1)] group">
            <h3 className="text-heading-3 text-ink group-hover:text-primary transition-colors">Tier 2: PostgreSQL Semantic</h3>
            <p className="text-body-sm text-slate leading-relaxed">
              Slightly altered queries ("What is LangGraph" vs "Tell me about LangGraph") are resolved via pgvector cosine similarity. If distance &lt; 0.05, the cached response is served.
            </p>
            <div className="bg-surface-code p-4 rounded border border-hairline font-mono text-xs text-white/80 shadow-inner">
              <span className="text-accent-red">SELECT</span> response, <span className="text-accent-green">1</span> - (embedding &lt;=&gt; query_emb) <span className="text-accent-red">AS</span> sim<br/>
              <span className="text-accent-red">FROM</span> search_cache<br/>
              <span className="text-accent-red">WHERE</span> sim &gt; <span className="text-accent-green">0.95</span> <span className="text-accent-red">LIMIT</span> <span className="text-accent-green">1</span>;
            </div>
          </motion.div>
        </motion.div>

        {/* Benefits List */}
        <motion.div 
          variants={containerVars}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-hairline"
        >
          <motion.div variants={itemVars} className="space-y-3 group hover:bg-cream-soft p-4 rounded-xl transition-colors cursor-default">
            <Clock className="text-primary group-hover:scale-110 transition-transform" size={20} />
            <h4 className="text-sm font-bold font-mono text-ink group-hover:text-primary transition-colors">Zero-Latency Hits</h4>
            <p className="text-xs text-slate">Bypass the 142ms search provider wait time entirely for cached results.</p>
          </motion.div>
          <motion.div variants={itemVars} className="space-y-3 group hover:bg-cream-soft p-4 rounded-xl transition-colors cursor-default">
            <Lock className="text-primary group-hover:scale-110 transition-transform" size={20} />
            <h4 className="text-sm font-bold font-mono text-ink group-hover:text-primary transition-colors">Rate-Limit Immunity</h4>
            <p className="text-xs text-slate">Cached results do not count against your search provider quotas or cost you tokens.</p>
          </motion.div>
          <motion.div variants={itemVars} className="space-y-3 group hover:bg-cream-soft p-4 rounded-xl transition-colors cursor-default">
            <Server className="text-primary group-hover:scale-110 transition-transform" size={20} />
            <h4 className="text-sm font-bold font-mono text-ink group-hover:text-primary transition-colors">Bypass WAFs</h4>
            <p className="text-xs text-slate">Heavily guarded URLs scraped successfully once are cached for all future agent requests.</p>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
