import React, { useState } from 'react'
import { Terminal, Key, Play, FileText, Sparkles, BarChart, ChevronRight, Copy, Check } from 'lucide-react'

export default function Docs() {
  const [activeSec, setActiveSec] = useState('auth')
  const [copiedCode, setCopiedCode] = useState('')

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const sections = [
    { id: 'auth', label: 'Authentication', icon: Key },
    { id: 'search', label: 'Web Search', icon: Play },
    { id: 'extract', label: 'Extract content', icon: FileText },
    { id: 'research', label: 'Deep Research', icon: Sparkles },
    { id: 'usage', label: 'Usage', icon: BarChart }
  ]

  const docsContent = {
    auth: {
      title: 'Authentication',
      desc: 'All endpoints except /health are protected by API Keys. Keys are generated via /auth/register or inside the Developer Portal. Pass your secret key in the headers of all HTTP requests.',
      endpoint: 'Header Format',
      method: 'X-API-Key',
      path: 'sm_live_...',
      curl: `curl -H "X-API-Key: sm_live_YOUR_KEY" http://localhost:8000/v1/usage`,
      python: `from searchmind import SearchMindClient\nclient = SearchMindClient(api_key="sm_live_YOUR_KEY")`,
      params: [
        { name: 'X-API-Key', type: 'String (Header)', required: 'Yes', desc: 'Secure SHA-256 hashed API key (e.g. sm_live_abc1...)' }
      ]
    },
    search: {
      title: 'Perform Search',
      desc: 'Orchestrates search provider pipelines (Brave -> SerpAPI -> DuckDuckGo) returning ordered web results optimized for LLM contexts. Includes optional Claude/Groq synthesis to answer the prompt directly.',
      endpoint: 'POST',
      path: '/v1/search',
      curl: `curl -X POST http://localhost:8000/v1/search \\
  -H "X-API-Key: sm_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "FastAPI async best practices",
    "num_results": 3,
    "search_depth": "basic",
    "include_answer": true
  }'`,
      python: `from searchmind import SearchMindClient\n\nclient = SearchMindClient(api_key="YOUR_KEY")\nresponse = client.search(\n    query="FastAPI async best practices",\n    num_results=3,\n    search_depth="basic"\n)`,
      params: [
        { name: 'query', type: 'String', required: 'Yes', desc: 'Search query to look up on the web (max 400 chars).' },
        { name: 'num_results', type: 'Integer', required: 'No (Default: 5)', desc: 'Number of results to retrieve (min 1, max 20).' },
        { name: 'search_depth', type: 'String', required: 'No (Default: basic)', desc: '"basic" for snippets, "advanced" for full page HTML extractions.' },
        { name: 'include_answer', type: 'Boolean', required: 'No (Default: true)', desc: 'synthesizes a 2-4 sentence LLM summary answering the query.' },
        { name: 'topic', type: 'String', required: 'No (Default: general)', desc: '"general", "news", "finance", "science", "technology".' },
        { name: 'time_range', type: 'String', required: 'No', desc: '"pd" (day), "pw" (week), "pm" (month), "py" (year).' }
      ]
    },
    extract: {
      title: 'Extract URL Content',
      desc: 'Retrieves raw HTML from one or more URLs, strips navigation, scripts, ads, and returns clean text content using a cascading parser chain (Trafilatura -> Readability -> BeautifulSoup). Supports optional Playwright JS rendering.',
      endpoint: 'POST',
      path: '/v1/extract',
      curl: `curl -X POST http://localhost:8000/v1/extract \\
  -H "X-API-Key: sm_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "urls": ["https://fastapi.tiangolo.com/"],
    "use_js_rendering": false,
    "max_content_length": 5000
  }'`,
      python: `from searchmind import SearchMindClient\n\nclient = SearchMindClient(api_key="YOUR_KEY")\nresponse = client.extract(\n    urls=["https://fastapi.tiangolo.com/"],\n    use_js_rendering=False\n)`,
      params: [
        { name: 'urls', type: 'Array of Strings', required: 'Yes', desc: 'List of target URLs to scrape (max 10).' },
        { name: 'use_js_rendering', type: 'Boolean', required: 'No (Default: false)', desc: 'Launches headless Chromium Playwright to render JS-heavy pages.' },
        { name: 'max_content_length', type: 'Integer', required: 'No (Default: 5000)', desc: 'Max character limit of page content text to return.' }
      ]
    },
    research: {
      title: 'Deep Research Task',
      desc: 'Generates multiple query vectors, crawls and scrapes top 8+ URLs in parallel, ranks results, and calls Groq/Claude models to assemble a comprehensive research summary with citations.',
      endpoint: 'POST',
      path: '/v1/research',
      curl: `curl -X POST http://localhost:8000/v1/research \\
  -H "X-API-Key: sm_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "vector database comparison 2025",
    "max_sources": 8,
    "include_summary": true
  }'`,
      python: `from searchmind import SearchMindClient\n\nclient = SearchMindClient(api_key="YOUR_KEY")\nresponse = client.research(\n    query="vector database comparison 2025",\n    max_sources=8\n)`,
      params: [
        { name: 'query', type: 'String', required: 'Yes', desc: 'Research query/topic.' },
        { name: 'max_sources', type: 'Integer', required: 'No (Default: 10)', desc: 'Max sources to retrieve and crawl (max 15).' },
        { name: 'include_summary', type: 'Boolean', required: 'No (Default: true)', desc: 'Include long-form LLM analysis report.' }
      ]
    },
    usage: {
      title: 'Get Usage Stats',
      desc: 'Retrieves current period stats (requests per endpoint, token consumption, limits, remaining requests, percentage of limits consumed).',
      endpoint: 'GET',
      path: '/v1/usage',
      curl: `curl -s -H "X-API-Key: sm_live_YOUR_KEY" http://localhost:8000/v1/usage`,
      python: `from searchmind import SearchMindClient\n\nclient = SearchMindClient(api_key="YOUR_KEY")\nusage = client.get_usage()`,
      params: []
    }
  }

  const activeDoc = docsContent[activeSec]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <div className="md:col-span-3 space-y-2">
          <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider px-3 mb-4">Endpoints</h3>
          
          <div className="flex flex-col gap-1">
            {sections.map((sec) => {
              const Icon = sec.icon
              const isSelected = activeSec === sec.id
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSec(sec.id)}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                    isSelected 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={14} />
                    {sec.label}
                  </span>
                  <ChevronRight size={14} className={isSelected ? 'opacity-100' : 'opacity-0'} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Documentation Content */}
        <div className="md:col-span-9 space-y-8 bg-black/20 border border-brand-border/40 p-8 rounded-2xl">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">{activeDoc.title}</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{activeDoc.desc}</p>
          </div>

          {/* Endpoint badge */}
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-lg border border-brand-border/60 max-w-fit font-mono text-sm">
            <span className={`px-2 py-0.5 rounded text-xs font-extrabold uppercase ${
              activeDoc.endpoint === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
              activeDoc.endpoint === 'GET' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
              'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            }`}>
              {activeDoc.endpoint}
            </span>
            <span className="text-gray-300">{activeDoc.path}</span>
          </div>

          {/* Parameters Table */}
          {activeDoc.params.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Request Parameters</h3>
              <div className="overflow-x-auto border border-brand-border/60 rounded-xl">
                <table className="min-w-full divide-y divide-brand-border/40 text-xs">
                  <thead className="bg-black/30 text-gray-400">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">Field</th>
                      <th className="px-4 py-3 text-left font-bold">Type</th>
                      <th className="px-4 py-3 text-left font-bold">Required</th>
                      <th className="px-4 py-3 text-left font-bold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40 text-gray-300 bg-[#030712]/20">
                    {activeDoc.params.map((p) => (
                      <tr key={p.name}>
                        <td className="px-4 py-3 font-mono text-indigo-400 font-bold">{p.name}</td>
                        <td className="px-4 py-3 font-mono text-gray-500">{p.type}</td>
                        <td className="px-4 py-3 font-semibold text-gray-400">{p.required}</td>
                        <td className="px-4 py-3 text-gray-400">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Code Examples */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-brand-border/40">
            {/* cURL Example */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-400">
                <span>cURL Request</span>
                <button
                  onClick={() => handleCopy(`${activeSec}_curl`, activeDoc.curl)}
                  className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                >
                  {copiedCode === `${activeSec}_curl` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  Copy
                </button>
              </div>
              <pre className="p-4 bg-black/40 border border-brand-border/60 rounded-xl font-mono text-[11px] text-gray-300 overflow-x-auto leading-relaxed h-56 text-left">
                <code>{activeDoc.curl}</code>
              </pre>
            </div>

            {/* Python SDK Example */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-400">
                <span>Python SDK Code</span>
                <button
                  onClick={() => handleCopy(`${activeSec}_py`, activeDoc.python)}
                  className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                >
                  {copiedCode === `${activeSec}_py` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  Copy
                </button>
              </div>
              <pre className="p-4 bg-black/40 border border-brand-border/60 rounded-xl font-mono text-[11px] text-gray-300 overflow-x-auto leading-relaxed h-56 text-left">
                <code>{activeDoc.python}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
