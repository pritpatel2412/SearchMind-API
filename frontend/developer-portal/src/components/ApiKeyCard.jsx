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
    <div className="bg-surface-card border border-hairline-strong p-6 rounded-lg relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue-glow/5 rounded-full blur-2xl -z-10"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Key details */}
        <div className="space-y-2 flex-grow">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-surface-deep border border-hairline text-accent-blue">
              <Key size={14} />
            </div>
            <h3 className="font-semibold text-ink text-base font-display">{apiKey.name || 'API Key'}</h3>
            {apiKey.full_key && (
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green">
                New Key
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-surface-deep px-3 py-1.5 rounded border border-hairline-strong max-w-fit">
            <code className="text-xs font-mono text-body select-all">
              {apiKey.full_key ? apiKey.full_key : `${apiKey.key_prefix}••••••••••••••••••••••••••••`}
            </code>
            <button
              onClick={handleCopy}
              className="text-mute hover:text-ink transition-colors p-1 rounded hover:bg-surface-card"
              title="Copy key"
            >
              {copied ? <Check size={12} className="text-accent-green" /> : <Copy size={12} />}
            </button>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-mute">
            <span className="flex items-center gap-1.5">
              <Calendar size={11} />
              Created: {new Date(apiKey.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={11} />
              Rate limit: {apiKey.rate_limit_per_min} req/min
            </span>
          </div>
        </div>

        {/* Usage Gauges */}
        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-mute">
            <span>Quota Used</span>
            <span>{totalUsed.toLocaleString()} / {limit.toLocaleString()} requests</span>
          </div>
          <div className="w-full h-[6px] bg-surface-deep rounded-full overflow-hidden border border-hairline-strong">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 95 
                  ? 'bg-accent-red' 
                  : percentUsed > 80 
                  ? 'bg-accent-yellow' 
                  : 'bg-accent-blue'
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
                className="px-2 py-1 bg-accent-red text-ink rounded font-medium hover:brightness-110 text-[10px]"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmRevoke(false)}
                className="px-2 py-1 bg-surface-elevated text-ink border border-hairline-strong rounded font-medium hover:bg-surface-card text-[10px]"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRevoke(true)}
              className="p-2 text-mute hover:text-accent-red transition-colors hover:bg-accent-red/5 rounded-md"
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
