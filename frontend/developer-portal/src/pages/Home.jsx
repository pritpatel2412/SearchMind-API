import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Terminal, Key, ShieldCheck, Cpu, Code, CheckCircle, Sparkles } from 'lucide-react'

export default function Home({ token, setToken, user, setUser, setApiKey }) {
  const [isRegister, setIsRegister] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeTab, setCodeTab] = useState('python')
  
  const navigate = useNavigate()

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = isRegister ? '/v1/auth/register' : '/v1/auth/login'
    const body = isRegister 
      ? { email, password, full_name: fullName }
      : { email, password }

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed')
      }

      setToken(data.access_token)
      setUser({ id: data.user_id, email: data.email, plan: data.plan })
      if (data.full_key) {
        setApiKey(data.full_key)
      } else {
        // Fetch keys from backend
        fetchKeys(data.access_token)
      }
      
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchKeys = async (tokenStr) => {
    try {
      const res = await fetch('http://localhost:8000/v1/api-keys', {
        headers: { 'Authorization': `Bearer ${tokenStr}` }
      })
      const data = await res.json()
      if (res.ok && data.length > 0) {
        setApiKey(data[0].full_key || '')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const pythonCode = `from searchmind import SearchMindClient

client = SearchMindClient(api_key="sm_live_YOUR_KEY")

# Get structured results with AI answer synthesis
response = client.search(
    query="latest LangGraph release features",
    search_depth="basic"
)

print(response.answer)
`

  const curlCode = `curl -X POST http://localhost:8000/v1/search \\
  -H "X-API-Key: sm_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "latest LangGraph release features",
    "num_results": 5,
    "search_depth": "basic",
    "include_answer": true
  }'
`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 text-indigo-400 bg-indigo-500/5 text-xs font-semibold">
            <Sparkles size={12} />
            The AI-Native Search Engine for Agents
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Clean, Structured Web Results for{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Agents
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl">
            Drop-in Tavily alternative optimized for LLM pipelines, LangGraph, and RAG architectures. Retrieves clean page extractions, ranks by relevance, and synthesizes summaries in milliseconds.
          </p>
          <div className="flex gap-4">
            {token ? (
              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-lg font-bold text-sm bg-indigo-600 hover:bg-indigo-500 transition-all shadow-glow text-white"
              >
                Go to Dashboard
              </Link>
            ) : (
              <a
                href="#auth-section"
                className="px-6 py-3 rounded-lg font-bold text-sm bg-indigo-600 hover:bg-indigo-500 transition-all shadow-glow text-white"
              >
                Get Started Free
              </a>
            )}
            <Link
              to="/docs"
              className="px-6 py-3 rounded-lg font-bold text-sm bg-gray-800 hover:bg-gray-700 transition-all border border-brand-border text-gray-300"
            >
              Explore API Docs
            </Link>
          </div>
        </div>

        {/* Auth form or user state */}
        <div className="lg:col-span-5" id="auth-section">
          {token ? (
            <div className="glass-panel p-8 rounded-2xl border border-brand-border space-y-6 text-center">
              <div className="p-4 bg-indigo-500/10 rounded-full w-fit mx-auto text-indigo-400">
                <CheckCircle size={36} />
              </div>
              <h2 className="text-2xl font-bold text-white">Logged In Successfully</h2>
              <p className="text-gray-400 text-sm">
                You are registered on the <strong className="text-indigo-400 capitalize">{user?.plan}</strong> tier. You can now access your API keys dashboard.
              </p>
              <Link
                to="/dashboard"
                className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-lg font-bold text-sm text-center shadow-glow text-white"
              >
                Open Dashboard
              </Link>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl border border-brand-border space-y-6">
              <div className="flex justify-center border-b border-brand-border pb-4">
                <button
                  onClick={() => { setIsRegister(true); setError(''); }}
                  className={`flex-1 pb-2 font-bold text-sm transition-colors ${
                    isRegister ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  Register
                </button>
                <button
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className={`flex-1 pb-2 font-bold text-sm transition-colors ${
                    !isRegister ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-semibold text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {isRegister && (
                  <div className="flex flex-col text-left gap-1">
                    <label className="text-xs font-semibold text-gray-400">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      className="glass-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex flex-col text-left gap-1">
                  <label className="text-xs font-semibold text-gray-400">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    className="glass-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex flex-col text-left gap-1">
                  <label className="text-xs font-semibold text-gray-400">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="glass-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-gray-400 transition-all rounded-lg font-bold text-sm shadow-glow text-white"
                >
                  {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Code Demo Section */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-white">Simple API Integration</h2>
          <p className="text-gray-400 text-sm">
            Integrate structured searches into your application in seconds using the official SDK or pure http requests.
          </p>
        </div>

        <div className="glass-panel rounded-2xl border border-brand-border overflow-hidden max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex items-center justify-between bg-black/40 px-6 py-3 border-b border-brand-border/40">
            <div className="flex gap-4">
              <button
                onClick={() => setCodeTab('python')}
                className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                  codeTab === 'python' ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Code size={14} />
                Python SDK
              </button>
              <button
                onClick={() => setCodeTab('curl')}
                className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                  codeTab === 'curl' ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Terminal size={14} />
                cURL HTTP
              </button>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60"></div>
            </div>
          </div>

          <pre className="p-6 text-left overflow-x-auto bg-black/20 text-sm font-mono text-gray-300 leading-relaxed">
            <code>{codeTab === 'python' ? pythonCode : curlCode}</code>
          </pre>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="glass-panel p-6 rounded-2xl text-left border border-brand-border space-y-4">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
            <Terminal size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">Smart Search</h3>
          <p className="text-sm text-gray-400">
            Fallback search provider orchestration checks Brave Search, SerpAPI, and DuckDuckGo for high availability.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl text-left border border-brand-border space-y-4">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 w-fit">
            <Cpu size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">Page Extract</h3>
          <p className="text-sm text-gray-400">
            Crawls URL listings, strips boilerplate headers, styles, and extracts readable text with Playwright chromium rendering.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl text-left border border-brand-border space-y-4">
          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 w-fit">
            <Sparkles size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">Deep Research</h3>
          <p className="text-sm text-gray-400">
            Launches parallel search sub-queries, grabs top URL nodes, parses content, and runs LLM synthesis to form comprehensive answers.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl text-left border border-brand-border space-y-4">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">Agent Frameworks</h3>
          <p className="text-sm text-gray-400">
            Native integrations package client configurations directly as LangChain BaseTools and LangGraph react agents.
          </p>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-white">Simple, Transparent Pricing</h2>
          <p className="text-gray-400 text-sm">
            Start completely free. Upgrade anytime as your platform and agents request scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="glass-panel p-8 rounded-2xl border border-brand-border text-left flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <h4 className="font-extrabold text-lg text-gray-200">Free</h4>
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs text-gray-500 font-semibold ml-1">/mo</span>
              </div>
              <p className="text-xs text-gray-400">Ideal for testing search queries and initial sandbox designs.</p>
            </div>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-center gap-2">✓ 1,000 requests / month</li>
              <li className="flex items-center gap-2">✓ 5 requests / minute limit</li>
              <li className="flex items-center gap-2">✓ Basic search snippets</li>
              <li className="flex items-center gap-2">✓ Core URL content extractor</li>
            </ul>
            <a
              href="#auth-section"
              className="block w-full py-2 bg-gray-800 hover:bg-gray-700 transition-colors text-center text-xs font-bold rounded-lg text-gray-300 border border-brand-border"
            >
              Get Started
            </a>
          </div>

          {/* Starter Tier */}
          <div className="glass-panel p-8 rounded-2xl border-2 border-indigo-500/40 text-left flex flex-col justify-between space-y-6 relative">
            <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500 text-white shadow-glow">
              Popular
            </div>
            <div className="space-y-2">
              <h4 className="font-extrabold text-lg text-indigo-400">Starter</h4>
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold text-white">$29</span>
                <span className="text-xs text-gray-500 font-semibold ml-1">/mo</span>
              </div>
              <p className="text-xs text-gray-400">Perfect for running autonomous agents and lightweight workflows.</p>
            </div>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-center gap-2">✓ 10,000 requests / month</li>
              <li className="flex items-center gap-2">✓ 30 requests / minute limit</li>
              <li className="flex items-center gap-2">✓ Advanced deep full-page search</li>
              <li className="flex items-center gap-2">✓ Celery async background crawl</li>
              <li className="flex items-center gap-2">✓ LLM summary synthesis</li>
            </ul>
            <a
              href="#auth-section"
              className="block w-full py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-center text-xs font-bold rounded-lg text-white shadow-glow"
            >
              Subscribe Now
            </a>
          </div>

          {/* Pro Tier */}
          <div className="glass-panel p-8 rounded-2xl border border-brand-border text-left flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <h4 className="font-extrabold text-lg text-gray-200">Pro</h4>
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold text-white">$99</span>
                <span className="text-xs text-gray-500 font-semibold ml-1">/mo</span>
              </div>
              <p className="text-xs text-gray-400">For scaling production pipelines, large databases, and team workflows.</p>
            </div>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-center gap-2">✓ 100,000 requests / month</li>
              <li className="flex items-center gap-2">✓ 100 requests / minute limit</li>
              <li className="flex items-center gap-2">✓ Advanced deep search & crawl</li>
              <li className="flex items-center gap-2">✓ High-priority execution queues</li>
              <li className="flex items-center gap-2">✓ Multi-node caching rules</li>
            </ul>
            <a
              href="#auth-section"
              className="block w-full py-2 bg-gray-800 hover:bg-gray-700 transition-colors text-center text-xs font-bold rounded-lg text-gray-300 border border-brand-border"
            >
              Subscribe Now
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
