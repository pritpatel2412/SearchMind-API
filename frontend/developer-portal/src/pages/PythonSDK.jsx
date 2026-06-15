import React from 'react';
import { Terminal, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PythonSDK() {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

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
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center space-y-6 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono tracking-[0.35px] shadow-[0_0_15px_rgba(241,90,36,0.15)]">
            <Terminal size={11} className="animate-pulse" />
            <span>OFFICIAL SDK</span>
          </div>
          <h1 className="text-display-lg text-ink">
            Python <span className="font-serif italic text-primary">Integration</span>.
          </h1>
          <p className="text-body-md text-slate leading-relaxed">
            The official `searchmind-python` library provides type-safe clients, async support, and native bindings for LangChain, LlamaIndex, and LangGraph.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVars}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="space-y-8"
        >
          {/* Installation */}
          <motion.div variants={itemVars} className="space-y-4">
            <h3 className="text-heading-4 text-ink font-mono uppercase tracking-wider">1. Installation</h3>
            <div className="bg-surface-code rounded-lg p-4 flex justify-between items-center group hover:border-primary/50 transition-colors border border-transparent">
              <code className="text-sm font-mono text-white/90">pip install searchmind-api</code>
              <button onClick={() => copyToClipboard('pip install searchmind-api')} className="text-slate hover:text-primary transition-colors hover:scale-110 active:scale-95">
                <Copy size={16} />
              </button>
            </div>
          </motion.div>

          {/* Basic Usage */}
          <motion.div variants={itemVars} className="space-y-4">
            <h3 className="text-heading-4 text-ink font-mono uppercase tracking-wider">2. Basic Client</h3>
            <div className="bg-surface-code rounded-lg p-6 font-mono text-sm text-white/80 overflow-x-auto border border-hairline hover:border-primary/30 transition-colors shadow-inner">
              <pre>
                <span className="text-primary">from</span> searchmind <span className="text-primary">import</span> SearchMindClient<br/><br/>
                client = SearchMindClient(api_key=<span className="text-accent-green">"sm_live_..."</span>)<br/><br/>
                response = client.search(<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;query=<span className="text-accent-green">"Latest advancements in solid state batteries"</span>,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;search_depth=<span className="text-accent-green">"advanced"</span>, <span className="text-slate italic"># Parses full DOM of top results</span><br/>
                &nbsp;&nbsp;&nbsp;&nbsp;num_results=3<br/>
                )<br/><br/>
                <span className="text-primary">for</span> result <span className="text-primary">in</span> response.results:<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">print</span>(result.clean_markdown)
              </pre>
            </div>
          </motion.div>

          {/* LangChain Integration */}
          <motion.div variants={itemVars} className="space-y-4">
            <h3 className="text-heading-4 text-ink font-mono uppercase tracking-wider">3. LangChain Tools</h3>
            <div className="bg-surface-code rounded-lg p-6 font-mono text-sm text-white/80 overflow-x-auto border border-hairline hover:border-primary/30 transition-colors shadow-inner">
              <pre>
                <span className="text-primary">from</span> searchmind.langchain <span className="text-primary">import</span> SearchMindTool<br/>
                <span className="text-primary">from</span> langchain.agents <span className="text-primary">import</span> initialize_agent, AgentType<br/><br/>
                search_tool = SearchMindTool(api_key=<span className="text-accent-green">"sm_live_..."</span>)<br/><br/>
                agent = initialize_agent(<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;tools=[search_tool],<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;llm=chat_model,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;agent=AgentType.OPENAI_FUNCTIONS<br/>
                )<br/><br/>
                agent.run(<span className="text-accent-green">"Research the current market size of humanoids."</span>)
              </pre>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
