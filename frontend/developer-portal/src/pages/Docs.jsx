import React, { useState } from 'react'
import { Terminal, Key, Play, FileText, Sparkles, BarChart, ChevronRight, Copy, Check } from 'lucide-react'

export default function Docs({ apiKey }) {
  const [activeSec, setActiveSec] = useState('auth')
  const [copiedCode, setCopiedCode] = useState('')
  const displayKey = apiKey || 'sm_live_YOUR_KEY'
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
    { id: 'usage', label: 'Usage Status', icon: BarChart }
  ]

  const docsContent = {
    auth: {
      title: 'Authentication',
      desc: 'All endpoints except /health require API credentials. Keys are generated inside the Developer Portal. Pass your secret key in the X-API-Key header of all HTTP requests, or configure the SDK automatically by setting the SEARCHMIND_API_KEY environment variable.',
      endpoint: 'Header Format',
      method: 'X-API-Key',
      path: 'sm_live_...',
      curl: `curl -H "X-API-Key: ${displayKey}" ${apiUrl}/v1/usage`,
      python: `from searchmind import SearchMindClient\nclient = SearchMindClient(api_key="${displayKey}")`,
      params: [
        { name: 'X-API-Key', type: 'String (Header)', required: 'Yes', desc: 'Secure SHA-256 hashed API key (e.g. sm_live_abc1...)' }
      ]
    },
    search: {
      title: 'Perform Search',
      desc: 'Orchestrates search provider pipelines (Brave -> SerpAPI -> DuckDuckGo) returning ordered web results optimized for LLM contexts. Includes optional Claude/Groq synthesis to answer the prompt directly.',
      endpoint: 'POST',
      path: '/v1/search',
      curl: `curl -X POST ${apiUrl}/v1/search \\
  -H "X-API-Key: ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "FastAPI async best practices",
    "num_results": 3,
    "search_depth": "basic",
    "include_answer": true
  }'`,
      python: `from searchmind import SearchMindClient\n\nclient = SearchMindClient(api_key="${displayKey}")\nresponse = client.search(\n    query="FastAPI async best practices",\n    num_results=3,\n    search_depth="basic"\n)`,
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
      curl: `curl -X POST ${apiUrl}/v1/extract \\
  -H "X-API-Key: ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "urls": ["https://fastapi.tiangolo.com/"],
    "use_js_rendering": false,
    "max_content_length": 5000
  }'`,
      python: `from searchmind import SearchMindClient\n\nclient = SearchMindClient(api_key="${displayKey}")\nresponse = client.extract(\n    urls=["https://fastapi.tiangolo.com/"],\n    use_js_rendering=False\n)`,
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
      curl: `curl -X POST ${apiUrl}/v1/research \\
  -H "X-API-Key: ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "vector database comparison 2025",
    "max_sources": 8,
    "include_summary": true
  }'`,
      python: `from searchmind import SearchMindClient\n\nclient = SearchMindClient(api_key="${displayKey}")\nresponse = client.research(\n    query="vector database comparison 2025",\n    max_sources=8\n)`,
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
      curl: `curl -s -H "X-API-Key: ${displayKey}" ${apiUrl}/v1/usage`,
      python: `from searchmind import SearchMindClient\n\nclient = SearchMindClient(api_key="${displayKey}")\nusage = client.get_usage()`,
      params: []
    }
  }

  const activeDoc = docsContent[activeSec]

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 text-left relative glow-orange">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Sidebar Navigation */}
        <div className="md:col-span-3 space-y-2">
          <h3 className="text-micro-uppercase text-slate px-3 mb-4">API References</h3>
          
          <div className="flex flex-col gap-1">
            {sections.map((sec) => {
              const Icon = sec.icon
              const isSelected = activeSec === sec.id
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSec(sec.id)}
                  className={`flex items-center justify-between px-3 py-2.5 text-body-sm-medium rounded-md transition-all border ${
                    isSelected 
                      ? 'bg-cream-deeper text-ink border-beige-deep shadow-sm' 
                      : 'text-charcoal border-transparent hover:text-ink hover:bg-cream/40'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={12} className={isSelected ? 'text-primary' : 'text-slate'} />
                    {sec.label}
                  </span>
                  <ChevronRight size={12} className={isSelected ? 'opacity-100 text-primary' : 'opacity-0'} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Documentation Content */}
        <div className="md:col-span-9 space-y-8 card-base p-8 rounded-lg shadow-sm">
          <div className="space-y-3">
            <h2 className="text-heading-2 text-ink">{activeDoc.title}</h2>
            <p className="text-body-md text-charcoal leading-relaxed">{activeDoc.desc}</p>
          </div>

          {/* Endpoint badge */}
          <div className="flex items-center gap-3 bg-cream px-4 py-2.5 rounded-md border border-beige-deep max-w-fit font-mono text-xs">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
              activeDoc.endpoint === 'POST' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' : 
              activeDoc.endpoint === 'GET' ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' : 
              'bg-cream-deeper text-slate border-beige-deep'
            }`}>
              {activeDoc.endpoint}
            </span>
            <span className="text-ink font-semibold">{activeDoc.path}</span>
          </div>

          {/* Parameters Table */}
          {activeDoc.params.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-micro-uppercase text-slate">Request Parameters</h3>
              <div className="overflow-x-auto border border-beige-deep rounded-lg">
                <table className="min-w-full divide-y divide-beige-deep text-xs font-mono">
                  <thead className="bg-cream text-charcoal border-b border-beige-deep">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">Field</th>
                      <th className="px-4 py-3 text-left font-bold">Type</th>
                      <th className="px-4 py-3 text-left font-bold">Required</th>
                      <th className="px-4 py-3 text-left font-bold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-beige-deep/50 bg-cream-soft text-ink">
                    {activeDoc.params.map((p) => (
                      <tr key={p.name} className="hover:bg-cream-deeper/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-primary">{p.name}</td>
                        <td className="px-4 py-3 text-slate">{p.type}</td>
                        <td className="px-4 py-3 font-semibold text-ink">
                          <span className={p.required === 'Yes' ? 'text-primary' : 'text-slate'}>
                            {p.required}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate font-sans">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Code Examples */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-hairline">
            
            {/* cURL Example */}
            <div className="space-y-2.5 text-left">
              <div className="flex justify-between items-center text-micro-uppercase text-slate">
                <span>cURL Request</span>
                <button
                  onClick={() => handleCopy(`${activeSec}_curl`, activeDoc.curl)}
                  className="flex items-center gap-1 hover:text-ink transition-colors font-semibold"
                >
                  {copiedCode === `${activeSec}_curl` ? <Check size={11} className="text-accent-green" /> : <Copy size={11} />}
                  Copy
                </button>
              </div>
              <div className="bg-surface-code border border-white/10 rounded-lg overflow-hidden relative shadow-md">
                <div className="flex gap-1.5 px-3 py-2 bg-surface-code/80 border-b border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-red opacity-80"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow opacity-80"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green opacity-80"></span>
                </div>
                <pre className="p-4 font-mono text-[11px] text-on-dark overflow-x-auto leading-relaxed h-56">
                  <code>{activeDoc.curl}</code>
                </pre>
              </div>
            </div>

            {/* Python SDK Example */}
            <div className="space-y-2.5 text-left">
              <div className="flex justify-between items-center text-micro-uppercase text-slate">
                <span>Python SDK Code</span>
                <button
                  onClick={() => handleCopy(`${activeSec}_py`, activeDoc.python)}
                  className="flex items-center gap-1 hover:text-ink transition-colors font-semibold"
                >
                  {copiedCode === `${activeSec}_py` ? <Check size={11} className="text-accent-green" /> : <Copy size={11} />}
                  Copy
                </button>
              </div>
              <div className="bg-surface-code border border-white/10 rounded-lg overflow-hidden relative shadow-md">
                <div className="flex gap-1.5 px-3 py-2 bg-surface-code/80 border-b border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-red opacity-80"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow opacity-80"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green opacity-80"></span>
                </div>
                <pre className="p-4 font-mono text-[11px] text-on-dark overflow-x-auto leading-relaxed h-56">
                  <code>{activeDoc.python}</code>
                </pre>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
