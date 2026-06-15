import React, { useState } from 'react'
import { Copy, Check, Trash2, Key, Calendar, ShieldCheck, Zap } from 'lucide-react'

export default function ApiKeyCard({ apiKey, usageStats, onRevoke }) {
  const [copied, setCopied] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  const handleCopy = () => {
    const keyToCopy = apiKey.full_key || apiKey.key_prefix + '...'
    navigator.clipboard.writeText(keyToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalUsed = usageStats?.total_requests || 0
  const limit = apiKey.monthly_limit || 500
  const percentUsed = Math.min(100, Math.max(0, (totalUsed / limit) * 100))

  return (
    <div className="bg-cream-soft/40 backdrop-blur-md border border-hairline rounded-lg p-6 relative overflow-hidden transition-all duration-300 hover:border-hairline-strong shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.02)]">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Key details */}
        <div className="space-y-3.5 flex-grow">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cream border border-beige-deep text-primary shadow-inner">
              <Key size={14} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-ink text-base font-sans leading-tight">{apiKey.name || 'API Key'}</h3>
              {apiKey.full_key ? (
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  New Key
                </span>
              ) : (
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cream-deeper border border-hairline-strong text-slate">
                  Active
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-4 bg-canvas/80 px-3.5 py-2.5 rounded-lg border border-hairline max-w-fit hover:border-primary/40 hover:bg-cream transition-all group cursor-pointer focus:outline-none"
            title="Click to copy key"
          >
            <code className="text-xs font-mono text-ink text-left select-all">
              {apiKey.full_key ? apiKey.full_key : `${apiKey.key_prefix}••••••••••••••••••••••••••••`}
            </code>
            <div className="text-steel group-hover:text-primary transition-colors">
              {copied ? <Check size={14} className="text-accent-green" /> : <Copy size={14} />}
            </div>
          </button>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-mono text-slate">
            <span className="flex items-center gap-1.5">
              <Calendar size={11} className="text-steel" />
              Created: {new Date(apiKey.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={11} className="text-steel" />
              Limit: {apiKey.rate_limit_per_min} req/min
            </span>
          </div>
        </div>

        {/* Right side: Usage Gauges & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 lg:border-l lg:border-hairline lg:pl-6 w-full lg:w-auto mt-2 lg:mt-0">
          
          {/* Usage Gauges */}
          <div className="w-full sm:w-56 space-y-2 shrink-0">
            <div className="flex justify-between text-[11px] font-mono text-slate">
              <span>Quota Used</span>
              <span className="font-semibold text-ink">
                {totalUsed.toLocaleString()} 
                <span className="text-slate font-normal"> / {limit.toLocaleString()}</span>
              </span>
            </div>
            <div className="w-full h-2 bg-canvas rounded-full overflow-hidden border border-hairline">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  percentUsed > 95 
                    ? 'bg-accent-red' 
                    : percentUsed > 80 
                    ? 'bg-accent-yellow' 
                    : 'bg-primary shadow-glow'
                }`}
                style={{ 
                  width: `${percentUsed}%`,
                  boxShadow: percentUsed <= 80 ? '0 0 6px rgba(241, 90, 36, 0.5)' : 'none'
                }}
              ></div>
            </div>
          </div>

          {/* Revoke Action */}
          <div className="flex items-center sm:justify-end shrink-0 sm:border-l sm:border-hairline sm:pl-6 border-t sm:border-t-0 pt-4 sm:pt-0">
            {confirmRevoke ? (
              <div className="flex flex-col items-center gap-2 font-mono text-[10px]">
                <span className="text-accent-red font-semibold uppercase tracking-wider">Confirm Revoke?</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onRevoke(apiKey.id)}
                    className="px-3 py-1 bg-accent-red text-white rounded font-medium hover:brightness-110 cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmRevoke(false)}
                    className="px-3 py-1 bg-cream text-ink border border-beige-deep rounded font-medium hover:bg-cream-deeper cursor-pointer"
                  >
                    No
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRevoke(true)}
                className="p-2.5 text-slate hover:text-accent-red transition-all hover:bg-accent-red/5 rounded-lg border border-transparent hover:border-accent-red/20 cursor-pointer"
                title="Revoke key"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
