import React from 'react';
import { Activity, CheckCircle, Server, Globe, Database } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Status() {
  const systems = [
    { name: 'API Gateway (US-East)', status: 'operational', uptime: '99.99%', icon: <Globe size={16} /> },
    { name: 'Scraping Cluster (Playwright)', status: 'operational', uptime: '99.95%', icon: <Server size={16} /> },
    { name: 'Semantic Cache (Redis/PG)', status: 'operational', uptime: '100.0%', icon: <Database size={16} /> },
    { name: 'Brave Search Resolver', status: 'operational', uptime: '99.98%', icon: <Activity size={16} /> },
  ];

  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="w-full min-h-screen bg-canvas text-ink py-20 px-6 md:px-8 relative overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <h1 className="text-display-md text-ink">System Status</h1>
            <div className="px-3 py-1 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-mono font-bold flex items-center gap-2 tracking-wider uppercase shadow-[0_0_15px_rgba(0,255,136,0.15)]">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
              All Systems Operational
            </div>
          </div>
          <p className="text-body-sm text-slate">
            Real-time status of the SearchMind API, scraping clusters, and cache infrastructure.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-cream border border-beige-deep rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.1)] hover:border-primary/30 transition-colors duration-500"
        >
          <div className="px-6 py-4 border-b border-hairline bg-cream-soft flex justify-between items-center">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate">Component</span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate">Uptime (90d)</span>
          </div>
          
          <motion.div 
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="divide-y divide-hairline"
          >
            {systems.map((sys, idx) => (
              <motion.div variants={itemVars} key={idx} className="px-6 py-5 flex items-center justify-between hover:bg-cream-soft/80 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="text-slate group-hover:text-primary transition-colors">{sys.icon}</div>
                  <div>
                    <h4 className="text-sm font-bold text-ink group-hover:text-primary transition-colors">{sys.name}</h4>
                    <span className="text-xs text-accent-green capitalize flex items-center gap-1 mt-1 font-mono">
                      <CheckCircle size={10} className="animate-pulse" /> {sys.status}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-mono text-ink group-hover:text-primary transition-colors">
                  {sys.uptime}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Mock Incidents */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="pt-8 border-t border-hairline space-y-6"
        >
          <h3 className="text-heading-4 text-ink font-mono uppercase tracking-wider text-sm">Past Incidents</h3>
          <div className="text-center py-12 border border-dashed border-beige-deep rounded-lg bg-cream/50 text-slate text-sm hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-default">
            No incidents reported in the last 30 days.
          </div>
        </motion.div>

      </div>
    </div>
  );
}
