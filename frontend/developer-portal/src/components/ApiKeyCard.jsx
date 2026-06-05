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
  const limit = apiKey.monthly_limit || 1000
  const percentUsed = Math.min(100, Math.max(0, (totalUsed / limit) * 100))

  return (
    <div className="card-base relative overflow-hidden transition-all duration-300">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Key details */}
        <div className="space-y-2 flex-grow">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-cream border border-beige-deep text-primary">
              <Key size={14} />
            </div>
            <h3 className="font-semibold text-ink text-base font-sans">{apiKey.name || 'API Key'}</h3>
            {apiKey.full_key && (
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                New Key
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-cream-soft px-3 py-1.5 rounded border border-beige-deep max-w-fit">
            <code className="text-xs font-mono text-ink select-all">
              {apiKey.full_key ? apiKey.full_key : `${apiKey.key_prefix}••••••••••••••••••••••••••••`}
            </code>
            <button
              onClick={handleCopy}
              className="text-steel hover:text-primary transition-colors p-1 rounded hover:bg-cream-deeper"
              title="Copy key"
            >
              {copied ? <Check size={12} className="text-accent-green" /> : <Copy size={12} />}
            </button>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-slate">
            <span className="flex items-center gap-1.5">
              <Calendar size={11} className="text-steel" />
              Created: {new Date(apiKey.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={11} className="text-steel" />
              Rate limit: {apiKey.rate_limit_per_min} req/min
            </span>
          </div>
        </div>

        {/* Usage Gauges */}
        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-slate">
            <span>Quota Used</span>
            <span>{totalUsed.toLocaleString()} / {limit.toLocaleString()} requests</span>
          </div>
          <div className="w-full h-[6px] bg-cream rounded-full overflow-hidden border border-beige-deep">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 95 
                  ? 'bg-accent-red' 
                  : percentUsed > 80 
                  ? 'bg-accent-yellow' 
                  : 'bg-primary'
              }`}
              style={{ width: `${percentUsed}%` }}
            ></div>
          </div>
        </div>

        {/* Revoke Action */}
        <div className="flex items-center justify-end">
          {confirmRevoke ? (
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-accent-red font-semibold">Confirm Revoke?</span>
              <button
                onClick={() => onRevoke(apiKey.id)}
                className="px-2.5 py-1 bg-accent-red text-white rounded font-medium hover:brightness-110 text-[10px]"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmRevoke(false)}
                className="px-2.5 py-1 bg-cream text-ink border border-beige-deep rounded font-medium hover:bg-cream-deeper text-[10px]"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRevoke(true)}
              className="p-2 text-slate hover:text-accent-red transition-colors hover:bg-accent-red/5 rounded-md"
              title="Revoke key"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
