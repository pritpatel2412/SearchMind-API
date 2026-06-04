import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Terms() {
  return (
    <div className="w-full bg-canvas text-ink min-h-screen relative overflow-hidden flex flex-col items-center glow-blue">
      
      <section className="w-full max-w-3xl px-6 md:px-8 py-[96px] space-y-16 relative z-10 text-left">
        
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-mute hover:text-ink transition-colors">
          <ArrowLeft size={12} />
          Back to Home
        </Link>

        {/* Page Header */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-display font-medium leading-[1.05] -tracking-[1px] text-ink">
            Terms of Service
          </h1>
          <p className="text-xs font-mono text-mute">
            Last updated: January 15, 2026
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">1. Acceptance of Terms</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              By accessing or using the SearchMind API platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. These Terms apply to all visitors, users, and developers who access or use the Service.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">2. Description of Service</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              SearchMind API provides AI-native web search, content extraction, deep research synthesis, and asynchronous crawling endpoints designed for LLM agent pipelines, LangChain integrations, and RAG system workflows. The Service is delivered via RESTful API endpoints secured with API key authentication.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">3. API Usage & Rate Limits</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              Your use of the API is subject to rate limits and usage quotas based on your subscription plan. Exceeding your plan's allocated request volume may result in temporary throttling or service suspension. Current plan limits are:
            </p>
            <div className="bg-surface-card border border-hairline-strong rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-elevated border-b border-hairline-strong">
                  <tr>
                    <th className="px-4 py-3 text-mute font-bold uppercase tracking-wider text-[10px]">Plan</th>
                    <th className="px-4 py-3 text-mute font-bold uppercase tracking-wider text-[10px]">Requests / Month</th>
                    <th className="px-4 py-3 text-mute font-bold uppercase tracking-wider text-[10px]">Rate Limit</th>
                  </tr>
                </thead>
                <tbody className="text-body">
                  <tr className="border-b border-hairline">
                    <td className="px-4 py-3 text-ink font-semibold">Free</td>
                    <td className="px-4 py-3">1,000</td>
                    <td className="px-4 py-3">5 req/min</td>
                  </tr>
                  <tr className="border-b border-hairline">
                    <td className="px-4 py-3 text-ink font-semibold">Starter</td>
                    <td className="px-4 py-3">10,000</td>
                    <td className="px-4 py-3">30 req/min</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-ink font-semibold">Pro</td>
                    <td className="px-4 py-3">100,000</td>
                    <td className="px-4 py-3">100 req/min</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">4. API Keys & Security</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              You are responsible for safeguarding your API keys. Keys are hashed using SHA-256 on our servers and the full key is only displayed once at generation time. Do not share, publish, or embed your API key in client-side code. If you suspect your key has been compromised, revoke it immediately from your Dashboard and generate a new one.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">5. Prohibited Uses</h2>
            <p className="text-sm text-body font-sans leading-relaxed">You agree not to use the Service for:</p>
            <ul className="space-y-2 text-sm text-body font-sans leading-relaxed pl-4">
              <li className="flex items-start gap-2">
                <span className="text-accent-red mt-1 shrink-0">--</span>
                Scraping, harvesting, or redistributing third-party copyrighted content at scale without authorization.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-red mt-1 shrink-0">--</span>
                Distributing malware, phishing content, or using the API for any unlawful purpose.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-red mt-1 shrink-0">--</span>
                Circumventing rate limits, spoofing authentication, or reverse-engineering the Service.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-red mt-1 shrink-0">--</span>
                Reselling API access or sub-licensing your API keys to third parties without written consent.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">6. Data & Caching</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              SearchMind caches API responses using a dual-tier Redis + PostgreSQL architecture to improve latency and reduce upstream API costs. Cached responses may be served for identical queries within a configurable TTL window. You may request cache invalidation for your account by contacting support.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">7. Service Level Agreement</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              SearchMind targets 99.9% monthly uptime for paid plans. Scheduled maintenance windows will be communicated at least 48 hours in advance. The Service employs a multi-provider fallback chain (Brave, SerpAPI, DuckDuckGo) to minimize single-point-of-failure risks. No SLA guarantees apply to the Free tier.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">8. Modifications to Terms</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated "Last updated" date. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms. Material changes will be communicated via email to registered users.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">9. Limitation of Liability</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              The Service is provided "as is" without warranties of any kind. SearchMind shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to loss of data, revenue, or business opportunities.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">10. Contact</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              For questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@searchmind.dev" className="text-accent-blue hover:underline font-medium">
                legal@searchmind.dev
              </a>.
            </p>
          </div>

        </div>
      </section>
    </div>
  )
}
