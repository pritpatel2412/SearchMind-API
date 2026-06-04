import React, { useState } from 'react'
import { Copy, Check, Trash2, Key, Calendar, ShieldCheck, Zap } from 'lucide-react'

export default function ApiKeyCard({ apiKey, usageStats, onRevoke }) {
  const [copied, setCopied] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  const handleCopy = () => {
    // If the full key is visible, copy full_key, else prefix
    const keyToCopy = apiKey.full_key || apiKey.key_prefix + '...'
    navigator.clipboard.writeText(keyToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate percentage used
  const totalUsed = usageStats?.total_requests || 0
  const limit = apiKey.monthly_limit || 1000
  const percentUsed = Math.min(100, Math.max(0, (totalUsed / limit) * 100))

  return (
    <div className="glass-panel p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:border-indigo-500/20">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-10"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Key Info */}
        <div className="space-y-2 flex-grow">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400">
              <Key size={16} />
            </div>
            <h3 className="font-bold text-gray-200 text-lg">{apiKey.name || 'API Key'}</h3>
            {apiKey.full_key && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
                New
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-brand-border/60 max-w-fit">
            <code className="text-sm font-mono text-gray-300 select-all">
              {apiKey.full_key ? apiKey.full_key : `${apiKey.key_prefix}••••••••••••••••••••••••••••`}
            </code>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-indigo-400 transition-colors p-1 rounded hover:bg-gray-800"
              title="Copy key"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Created: {new Date(apiKey.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Zap size={12} />
              Rate: {apiKey.rate_limit_per_min} req/min
            </span>
          </div>
        </div>

        {/* Quota Progress */}
        <div className="w-full md:w-64 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-gray-400">
            <span>Monthly Usage</span>
            <span>{totalUsed} / {limit} requests</span>
          </div>
          <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-brand-border">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 90 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                  : percentUsed > 70 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600'
              }`}
              style={{ width: `${percentUsed}%` }}
            ></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end">
          {confirmRevoke ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400 font-semibold">Are you sure?</span>
              <button
                onClick={() => onRevoke(apiKey.id)}
                className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded font-medium"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmRevoke(false)}
                className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-medium border border-brand-border"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRevoke(true)}
              className="p-2 text-gray-500 hover:text-red-400 transition-colors hover:bg-red-500/5 rounded-lg"
              title="Revoke key"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
