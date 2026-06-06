import React from 'react';
import { Target, GitBranch, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UseCases() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
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
            <Target size={11} className="animate-pulse" />
            <span>ARCHITECTURAL PATTERNS</span>
          </div>
          <h1 className="text-display-lg text-ink">
            Built for <span className="font-serif italic text-primary">Production</span>.
          </h1>
          <p className="text-body-md text-slate leading-relaxed">
            See how engineering teams integrate SearchMind deeply into their autonomous agent workflows and highly-constrained RAG pipelines.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVars}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="space-y-8"
        >
          {/* Pattern 1 */}
          <motion.div variants={itemVars} className="card-base p-8 hover:border-primary/50 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.2)] group">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <GitBranch className="text-primary group-hover:scale-110 transition-transform" size={24} />
                  <h3 className="text-heading-3 text-ink group-hover:text-primary transition-colors">LangGraph Multi-Agent Workflows</h3>
                </div>
                <p className="text-body-sm text-slate leading-relaxed">
                  When mapping out complex `StateGraph` architectures in LangGraph, agents often need to pause and gather external context. SearchMind acts as the perfect deterministic tool node, pulling down exactly what the `Supervisor` agent requested without hallucination risks.
                </p>
              </div>
              <div className="flex-1 w-full bg-surface-code p-5 rounded-lg border border-hairline font-mono text-[10px] sm:text-xs text-white/80 shadow-inner group-hover:border-primary/30 transition-colors">
                <span className="text-accent-red">from</span> langgraph.graph <span className="text-accent-red">import</span> StateGraph<br/>
                <br/>
                <span className="text-slate italic"># Define the Search Node</span><br/>
                <span className="text-accent-red">async def</span> search_node(state):<br/>
                &nbsp;&nbsp;tasks = [client.search(topic) <span className="text-accent-red">for</span> topic <span className="text-accent-red">in</span> state['topics']]<br/>
                &nbsp;&nbsp;results = <span className="text-accent-red">await</span> asyncio.gather(*tasks)<br/>
                &nbsp;&nbsp;<span className="text-accent-red">return</span> {'{"research": results}'}
              </div>
            </div>
          </motion.div>

          {/* Pattern 2 */}
          <motion.div variants={itemVars} className="card-base p-8 hover:border-primary/50 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.2)] group">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="text-primary group-hover:scale-110 transition-transform" size={24} />
                  <h3 className="text-heading-3 text-ink group-hover:text-primary transition-colors">Real-Time Financial RAG</h3>
                </div>
                <p className="text-body-sm text-slate leading-relaxed">
                  Vector databases become stale the second they are embedded. For high-stakes queries like live stock analysis or breaking news RAG, SearchMind is injected as a pre-retrieval step to ground the LLM's answers in real-time internet facts.
                </p>
              </div>
              <div className="flex-1 w-full bg-surface-code p-5 rounded-lg border border-hairline font-mono text-[10px] sm:text-xs text-white/80 shadow-inner group-hover:border-primary/30 transition-colors">
                <span className="text-slate italic"># Hybrid Retrieval</span><br/>
                local_docs = vector_db.similarity_search(query)<br/>
                <br/>
                <span className="text-slate italic"># Augment with live internet facts</span><br/>
                live_facts = client.search(<br/>
                &nbsp;&nbsp;query, <br/>
                &nbsp;&nbsp;search_depth=<span className="text-accent-yellow">"advanced"</span>, <br/>
                &nbsp;&nbsp;max_results=<span className="text-accent-green">3</span><br/>
                )<br/>
                <br/>
                llm.predict(prompt.format(local=local_docs, live=live_facts))
              </div>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
