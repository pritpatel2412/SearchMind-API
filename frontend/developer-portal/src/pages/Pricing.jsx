import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Info, Mail, AlertTriangle, HelpCircle, X, ChevronDown, Gift } from 'lucide-react'

export default function Pricing({ token, user, setUser }) {
  const [billingPeriod, setBillingPeriod] = useState('monthly') // 'monthly' | 'annually'
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  
  // FAQ state
  const [openFaq, setOpenFaq] = useState(null)

  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    setCouponSuccess('')

    try {
      const response = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/v1/coupons/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Redemption failed')
      }
      setCouponSuccess(`Coupon code '${couponCode.trim().toUpperCase()}' successfully redeemed! Your account has been upgraded to ${data.plan.toUpperCase()}.`)
      setCouponCode('')
      
      if (user && setUser) {
        setUser({ ...user, plan: data.plan })
      }
    } catch (err) {
      setCouponError(err.message)
    } finally {
      setCouponLoading(false)
    }
  }

  const handlePlanClick = (planName) => {
    setSelectedPlan(planName)
    setShowModal(true)
    setUpgradeMessage('')
  }

  const handleActivateUpgrade = async () => {
    if (!token || !user) {
      setUpgradeMessage('Please register or log in first to upgrade your plan.')
      return
    }
    setUpgrading(true)
    setUpgradeMessage('')
    
    let planKey = 'free'
    if (selectedPlan === 'Developer Pro') planKey = 'pro'
    else if (selectedPlan === 'Scale Enterprise') planKey = 'enterprise'
    else if (selectedPlan === 'Free Sandbox') planKey = 'free'

    try {
      const response = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/admin/users/${user.id}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: planKey })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update plan')
      }
      
      const updatedUser = { ...user, plan: planKey }
      setUser(updatedUser)
      setUpgradeMessage(`Successfully upgraded to the ${selectedPlan} tier!`)
      setTimeout(() => setShowModal(false), 2000)
    } catch (err) {
      setUpgradeMessage(`Upgrade failed: ${err.message}`)
    } finally {
      setUpgrading(false)
    }
  }

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const pricingPlans = [
    {
      name: 'Free Sandbox',
      price: 0,
      desc: 'Ideal for initial integration tests, sandbox environments, and developer hobbies.',
      features: [
        '500 total lifetime credits',
        '5 requests per minute limit',
        'Access to /v1/search only',
        'Standard Trafilatura extraction',
        'Community discord support'
      ],
      buttonText: 'Start for Free',
      badge: 'HOBBY',
      popular: false
    },
    {
      name: 'Developer Pro',
      price: billingPeriod === 'monthly' ? 29 : 24, // 20% discount if annual
      desc: 'Engineered for operational AI agents, active RAG applications, and scaling workloads.',
      features: [
        '10,000 queries per month',
        '30 requests per minute limit',
        'Access to /v1/extract & /v1/crawl',
        'Dual-tier cache lookup (Redis/Postgres)',
        'Playwright headless client fallback',
        'Priority API support'
      ],
      buttonText: 'Subscribe Now',
      badge: 'STARTER',
      popular: true
    },
    {
      name: 'Scale Enterprise',
      price: billingPeriod === 'monthly' ? 99 : 79,
      desc: 'For high-throughput agent loops, continuous domain scraping, and multi-tenant applications.',
      features: [
        '100,000+ queries per month',
        '120+ requests per minute limit',
        'Full access including /v1/research',
        'Parallel Celery crawling tasks',
        'Dedicated proxy servers',
        '99.98% Uptime SLA'
      ],
      buttonText: 'Subscribe Now',
      badge: 'PRO',
      popular: false
    }
  ]

  const faqs = [
    {
      q: 'How does the multi-provider search fallback work?',
      a: 'SearchMind runs a cascading resolver chain. When a query is made, it queries the primary index (Brave Search) for high-speed, LLM-optimized snippets. If rate limits are met or results are insufficient, it silently falls back to SerpAPI, and finally DuckDuckGo, guaranteeing high search success rates.'
    },
    {
      q: 'What is the difference between basic and advanced search depth?',
      a: 'Basic search retrieves web snippets and titles directly from the search index (extremely fast, low token cost). Advanced search fetches the top target URLs and launches our parsing pipeline to extract clean body content, removing boilerplate like ads and cookie banners.'
    },
    {
      q: 'Can I set custom limits on my API Keys?',
      a: 'Yes, inside the Developer Dashboard you can provision multiple keys and configure separate rate limits (per minute) and monthly caps on each key to avoid unexpected usage leaks.'
    },
    {
      q: 'Do you offer custom enterprise plans?',
      a: 'Absolutely. If your agent requires millions of requests per month, custom search engines, or private deployment, please reach out to us at try.prit24@gmail.com for enterprise terms.'
    }
  ]

  return (
    <div className="w-full min-h-screen bg-canvas text-ink py-16 px-6 md:px-8 relative overflow-hidden glow-red">
      
      {/* Dynamic background glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-blue/5 blur-[100px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        
        {/* Header Block */}
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono tracking-[0.35px]">
            <Info size={11} />
            <span>TRANSPARENT TIER MANAGEMENT</span>
          </div>
          
          <h1 className="text-display-lg text-ink">
            Simple pricing for <br />
            <span className="font-serif italic text-primary">scaling agent pipelines</span>.
          </h1>
          <p className="text-body-md text-slate leading-relaxed">
            Start completely free with 500 lifetime credits. Switch plans as your workload grows. No hidden costs.
          </p>

          {/* Billing Switcher Tab */}
          <div className="flex items-center justify-center pt-2">
            <div className="bg-cream border border-beige-deep p-1 rounded-lg flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-1.5 rounded transition-all ${
                  billingPeriod === 'monthly' ? 'bg-cream-deeper text-ink font-semibold' : 'text-slate hover:text-ink'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annually')}
                className={`px-4 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  billingPeriod === 'annually' ? 'bg-cream-deeper text-ink font-semibold' : 'text-slate hover:text-ink'
                }`}
              >
                Annually
                <span className="text-[9px] bg-primary/15 text-primary border border-primary/25 px-1 rounded-full font-bold">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`card-base flex flex-col justify-between space-y-8 relative hover:scale-[1.01] hover:border-beige-deep transition-all duration-300 ${
                plan.popular 
                  ? 'border-2 border-primary bg-cream-soft shadow-[0_0_25px_rgba(241,90,36,0.08)]' 
                  : 'bg-cream/50'
              }`}
            >
              {plan.popular && (
                <span className="absolute top-0 right-6 -translate-y-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-primary text-white">
                  RECOMMENDED
                </span>
              )}

              <div className="space-y-4">
                <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border ${
                  plan.popular 
                    ? 'bg-primary/10 text-primary border-primary/25' 
                    : 'bg-cream text-slate border-beige-deep'
                }`}>
                  {plan.badge}
                </span>

                <h3 className="text-heading-3 text-ink mt-2 font-semibold">{plan.name}</h3>
                <p className="text-body-sm text-slate leading-relaxed">{plan.desc}</p>

                <div className="flex items-baseline pt-2">
                  <span className="text-stat-display text-ink font-serif font-light">${plan.price}</span>
                  <span className="text-caption text-steel font-mono ml-1">/month</span>
                </div>
              </div>

              {/* Feature checklist */}
              <ul className="space-y-3 text-xs text-charcoal font-mono border-t border-hairline pt-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={12} className="text-accent-green shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanClick(plan.name)}
                className={`w-full text-center font-bold font-sans ${
                  plan.popular ? 'button-primary' : 'button-outline'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Coupon Redemption Section */}
        <div className="card-base p-8 max-w-xl mx-auto space-y-6 relative overflow-hidden bg-cream/40 border border-beige-deep text-left">
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase font-bold tracking-wider">
            <Gift size={14} className="animate-pulse" />
            <span>Redeem Promotion Coupon</span>
          </div>
          <div>
            <h3 className="text-heading-4 text-ink font-semibold">Have a promotion code?</h3>
            <p className="text-body-sm text-slate mt-1 leading-relaxed">
              Enter your coupon code below to upgrade your plan and unlock premium features for a limited time.
            </p>
          </div>

          {!token ? (
            <div className="bg-[#121210] border border-hairline p-4 rounded-xl text-center font-mono text-xs text-slate">
              Please <Link to="/auth?mode=login" className="text-primary hover:underline font-bold">log in</Link> or <Link to="/auth?mode=register" className="text-primary hover:underline font-bold">register</Link> to redeem coupons.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g. LAUNCH50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={couponLoading}
                  className="glass-input flex-grow font-mono uppercase"
                />
                <button
                  onClick={handleRedeemCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="button-primary font-semibold text-xs tracking-wider uppercase h-[44px] px-6 select-none shrink-0"
                >
                  {couponLoading ? 'Validating...' : 'Redeem Code'}
                </button>
              </div>

              {couponError && (
                <div className="p-3 bg-accent-red/5 border border-accent-red/25 rounded-md flex items-start gap-2.5 text-accent-red font-mono text-[11px] leading-relaxed">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>{couponError}</span>
                </div>
              )}

              {couponSuccess && (
                <div className="p-3 bg-accent-green/5 border border-accent-green/25 rounded-md flex items-start gap-2.5 text-accent-green font-mono text-[11px] leading-relaxed">
                  <Check size={13} className="shrink-0 mt-0.5" />
                  <span>{couponSuccess}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FAQs Section */}
        <div className="pt-16 border-t border-hairline max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-heading-2 text-ink">Subscription FAQs</h2>
            <p className="text-caption text-slate">Answers to common billing and platform capacity questions.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div 
                  key={index}
                  className="bg-cream border border-beige-deep rounded-lg overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left text-body-sm-medium text-ink font-semibold"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown 
                      size={14} 
                      className={`text-slate transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} 
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs text-slate font-mono border-t border-hairline leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* CUSTOM BETA NOTIFICATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-md">
          <div className="card-cream border border-beige-deep max-w-md w-full p-8 space-y-6 relative shadow-2xl animate-shake">
            
            <div className="flex justify-between items-center pb-2 border-b border-beige-deep">
              <div className="flex items-center gap-2 text-primary">
                <AlertTriangle size={18} />
                <h3 className="text-heading-4 text-ink font-semibold">Beta Platform Notice</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate hover:text-primary transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 font-sans text-xs text-charcoal leading-relaxed text-left">
              <p>
                You selected the <strong>{selectedPlan}</strong>.
              </p>
              <div className="bg-[#121210] border border-hairline p-4 rounded-xl text-slate font-mono space-y-3 leading-relaxed">
                <p>
                  SearchMind is currently in beta and under active development. We advise against making any payments until the stable version is officially released.
                </p>
                <p>
                  Interested in testing features, sharing feedback, or learning more? Contact us at <a href="mailto:try.prit24@gmail.com" className="text-primary hover:underline">try.prit24@gmail.com</a>.
                </p>
                <p>
                  Your feedback helps shape the future of SearchMind.
                </p>
              </div>
            </div>

            {/* Email Contact Box */}
            <div className="flex items-center gap-3 bg-surface-code border border-hairline px-4 py-3 rounded-lg font-mono text-xs">
              <Mail size={14} className="text-primary shrink-0" />
              <a 
                href="mailto:try.prit24@gmail.com" 
                className="text-primary font-bold hover:underline select-all"
              >
                try.prit24@gmail.com
              </a>
            </div>

            <div className="flex gap-3 pt-2">
              <a
                href="mailto:try.prit24@gmail.com"
                className="button-primary flex-1 font-semibold text-center flex items-center justify-center"
              >
                Contact Team
              </a>
              <button
                onClick={() => setShowModal(false)}
                className="button-cream flex-1 cursor-pointer"
              >
                Close Notice
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
