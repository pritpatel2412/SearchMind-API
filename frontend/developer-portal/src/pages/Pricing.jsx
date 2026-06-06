import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Info, Mail, AlertTriangle, HelpCircle, X, ChevronDown } from 'lucide-react'

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState('monthly') // 'monthly' | 'annually'
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  // FAQ state
  const [openFaq, setOpenFaq] = useState(null)

  const handlePlanClick = (planName) => {
    setSelectedPlan(planName)
    setShowModal(true)
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
        '1,000 queries per month',
        '5 requests per minute limit',
        'Basic search depth (snippets only)',
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
        'Advanced search depth (full-DOM crawler)',
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
        '100,000 queries per month',
        '120 requests per minute limit',
        'Parallel Celery crawling tasks',
        'Custom cache TTL policies',
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
            Start completely free with 1,000 monthly credits. Switch plans as your workload grows. No hidden costs.
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
                className="text-slate hover:text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 font-sans text-xs text-charcoal leading-relaxed text-left">
              <p>
                You selected the <strong>{selectedPlan}</strong> plan.
              </p>
              <p className="bg-cream border border-beige-deep p-4 rounded-lg text-slate font-mono">
                SearchMind is currently in its active beta validation stage. We are not processing any monetary payments at this time, and the Free Sandbox tier is fully active for all registered tenants.
              </p>
              <p>
                If you require quota upgrades, custom rate limits, or have enterprise partnership inquiries, please get in touch with our team:
              </p>
            </div>

            {/* Email Contact Box */}
            <div className="flex items-center gap-3 bg-surface-code border border-beige-deep px-4 py-3 rounded-lg font-mono text-xs">
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
                className="button-primary flex-1 font-semibold"
              >
                Contact Team
              </a>
              <button
                onClick={() => setShowModal(false)}
                className="button-cream flex-1"
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
