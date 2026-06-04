import React, { useState } from 'react'
import { Play, Sparkles, AlertCircle, Clock, Database, ArrowRight, ExternalLink } from 'lucide-react'

export default function Playground({ token, apiKey }) {
  const [query, setQuery] = useState('')
  const [searchDepth, setSearchDepth] = useState('basic')
  const [topic, setTopic] = useState('general')
  const [includeAnswer, setIncludeAnswer] = useState(true)
  const [numResults, setNumResults] = useState(5)
  const [timeRange, setTimeRange] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [latency, setLatency] = useState(0)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResults(null)
    const startTime = Date.now()

    const payload = {
      query: query.trim(),
      num_results: parseInt(numResults),
      search_depth: searchDepth,
      include_answer: includeAnswer,
      topic: topic,
      max_content_length: 2000
    }

    if (timeRange) {
      payload.time_range = timeRange
    }

    try {
      const response = await fetch('http://localhost:8000/v1/search', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Search query failed')
      }

      setResults(data)
      setLatency(Date.now() - startTime)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Generate python preview matching exact user choices
  const pythonPreview = `from searchmind import SearchMindClient

client = SearchMindClient(api_key="YOUR_KEY")

response = client.search(
    query="${query || 'Search term...'}",
    num_results=${numResults},
    search_depth="${searchDepth}",
    topic="${topic}"${timeRange ? `,\n    time_range="${timeRange}"` : ''}
)

print(response.answer)
`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Search Playground</h1>
        <p className="text-sm text-gray-400">Query and preview live AI-native web results.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Parameters Form */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-brand-border space-y-6">
          <h3 className="font-bold text-gray-200 border-b border-brand-border/40 pb-3">Parameters</h3>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Search Query</label>
              <textarea
                required
                rows={2}
                placeholder="What are the main FastAPI async best practices?"
                className="glass-input resize-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Search Depth</label>
                <select 
                  className="glass-input" 
                  value={searchDepth} 
                  onChange={(e) => setSearchDepth(e.target.value)}
                >
                  <option value="basic">Basic (Fast)</option>
                  <option value="advanced">Advanced (Deep)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Results Count</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="glass-input"
                  value={numResults}
                  onChange={(e) => setNumResults(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Topic Area</label>
                <select 
                  className="glass-input" 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="news">News</option>
                  <option value="finance">Finance</option>
                  <option value="science">Science</option>
                  <option value="technology">Technology</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Time Range</label>
                <select 
                  className="glass-input" 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="">Any Time</option>
                  <option value="pd">Past Day (pd)</option>
                  <option value="pw">Past Week (pw)</option>
                  <option value="pm">Past Month (pm)</option>
                  <option value="py">Past Year (py)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-b border-brand-border/40">
              <span className="text-xs font-semibold text-gray-400">Synthesize Answer</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={includeAnswer}
                  onChange={(e) => setIncludeAnswer(e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all rounded-lg font-bold text-sm text-center flex items-center justify-center gap-2 shadow-glow text-white"
            >
              <Play size={14} fill="currentColor" />
              {loading ? 'Searching...' : 'Run Query'}
            </button>
          </form>

          {/* Python snippet mirror */}
          <div className="space-y-2 pt-4 border-t border-brand-border/40">
            <span className="text-xs font-semibold text-gray-500">Python SDK equivalent:</span>
            <pre className="p-3 bg-black/40 rounded-lg text-[10px] font-mono text-gray-400 overflow-x-auto">
              <code>{pythonPreview}</code>
            </pre>
          </div>
        </div>

        {/* Results Pane */}
        <div className="lg:col-span-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center font-semibold">
              {error}
            </div>
          )}

          {loading && (
            <div className="glass-panel p-16 rounded-2xl border border-brand-border text-center flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">Querying platform index cache and loading content...</p>
            </div>
          )}

          {!results && !loading && (
            <div className="glass-panel p-16 rounded-2xl border border-brand-border text-center text-sm text-gray-500">
              Run a query to preview response payloads.
            </div>
          )}

          {results && !loading && (
            <div className="space-y-6">
              {/* Performance indicators */}
              <div className="flex gap-4 text-xs font-semibold text-gray-400">
                <span className="flex items-center gap-1 bg-gray-800/40 px-3 py-1 rounded-full border border-brand-border/40">
                  <Clock size={12} />
                  Latency: {latency} ms (API reported: {results.response_time_ms || 0} ms)
                </span>
                <span className="flex items-center gap-1 bg-gray-800/40 px-3 py-1 rounded-full border border-brand-border/40">
                  <Database size={12} />
                  Cache Status: {results.cached ? 'Hit (Hot)' : 'Miss (Refetched)'}
                </span>
              </div>

              {/* Synthesized Answer Box */}
              {results.answer && (
                <div className="p-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Sparkles size={16} />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Answer Synthesis</h4>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{results.answer}</p>
                </div>
              )}

              {/* Ranked Cards */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Search Results ({results.results.length})</h4>
                
                {results.results.map((r, i) => (
                  <div key={r.url + i} className="glass-panel p-6 rounded-xl border border-brand-border/60 hover:border-brand-border space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <a 
                          href={r.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-bold text-gray-200 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                        >
                          {r.title || 'Untitled Webpage'}
                          <ExternalLink size={12} className="opacity-60" />
                        </a>
                        <span className="block text-xs font-mono text-gray-500 truncate max-w-lg">{r.url}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs">
                        Score {r.score.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed bg-black/20 p-3 rounded-lg border border-brand-border/30">
                      {r.content || 'No content returned.'}
                    </p>

                    <div className="flex gap-4 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                      {r.source_type && <span>Source: {r.source_type}</span>}
                      {r.published_date && <span>Age/Date: {r.published_date}</span>}
                      {r.author && <span>Author: {r.author}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
