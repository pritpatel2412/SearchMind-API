import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Privacy() {
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
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-mute">
            Last updated: January 15, 2026
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">1. Information We Collect</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              When you create an account, we collect your email address, full name, and a hashed version of your password (SHA-256 + bcrypt). We do not store plaintext passwords. API usage metadata (timestamps, endpoints accessed, response latencies) is logged for analytics and rate-limiting purposes.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">2. How We Use Your Data</h2>
            <p className="text-sm text-body font-sans leading-relaxed">We use the information we collect to:</p>
            <ul className="space-y-2 text-sm text-body font-sans leading-relaxed pl-4">
              <li className="flex items-start gap-2">
                <span className="text-accent-blue mt-1 shrink-0">--</span>
                Authenticate your identity and manage your account and API keys.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-blue mt-1 shrink-0">--</span>
                Enforce rate limits and usage quotas based on your subscription plan.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-blue mt-1 shrink-0">--</span>
                Generate aggregated, anonymized analytics to improve service reliability and performance.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-blue mt-1 shrink-0">--</span>
                Send transactional emails related to account activity (key generation, plan changes, security alerts).
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">3. API Query Data</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              Search queries submitted to our API endpoints are processed in real-time and forwarded to upstream search providers (Brave Search, SerpAPI, DuckDuckGo) as part of our multi-provider fallback architecture. Query content may be temporarily cached in our Redis and PostgreSQL cache layers to improve response times. Cached queries expire based on configurable TTL windows (default: 1 hour for basic, 30 minutes for advanced depth).
            </p>
            <div className="bg-surface-card border border-hairline-strong rounded-lg p-6 space-y-3">
              <h3 className="text-xs font-mono font-bold text-ink uppercase tracking-wider">Cache Architecture</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-body">
                <div className="space-y-1">
                  <span className="text-mute text-[10px] uppercase tracking-wider font-bold">Layer 1</span>
                  <p className="text-body">Redis in-memory cache (sub-10ms reads)</p>
                </div>
                <div className="space-y-1">
                  <span className="text-mute text-[10px] uppercase tracking-wider font-bold">Layer 2</span>
                  <p className="text-body">PostgreSQL persistent cache (durable, queryable)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">4. Data Sharing</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              We do not sell, rent, or share your personal information with third parties for marketing purposes. Data may be shared with upstream search providers solely to fulfill API requests. We may disclose information if required by law, regulation, or legal process.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">5. Data Security</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="space-y-2 text-sm text-body font-sans leading-relaxed pl-4">
              <li className="flex items-start gap-2">
                <span className="text-accent-green mt-1 shrink-0">--</span>
                API keys are hashed with SHA-256 before storage; full keys are only shown once at creation.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-green mt-1 shrink-0">--</span>
                Passwords are encrypted using bcrypt with automatic salting.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-green mt-1 shrink-0">--</span>
                All API traffic is transmitted over HTTPS with TLS 1.3 encryption.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-green mt-1 shrink-0">--</span>
                JWT authentication tokens expire after 24 hours and use RS256 signing.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">6. Data Retention</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              Account data is retained for the duration of your active subscription. Usage logs are retained for 90 days for analytics purposes and then automatically purged. Cached API responses are subject to TTL-based expiration. Upon account deletion, all personal data and API keys are permanently removed within 30 days.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">7. Your Rights</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              You have the right to access, correct, or delete your personal data at any time. You may export your usage data from the Dashboard. To request account deletion or data export, contact us at the email address below. We will respond to all data requests within 30 days.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">8. Cookies & Local Storage</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              The SearchMind developer portal uses browser localStorage to persist your authentication token, user profile, and API key for session continuity. We do not use third-party tracking cookies or advertising pixels. No data is shared with external analytics platforms.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">9. Changes to This Policy</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. We encourage you to review this page periodically. Material changes affecting your data rights will be communicated via email.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium text-ink -tracking-[0.4px]">10. Contact</h2>
            <p className="text-sm text-body font-sans leading-relaxed">
              For questions or concerns about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@searchmind.dev" className="text-accent-blue hover:underline font-medium">
                privacy@searchmind.dev
              </a>.
            </p>
          </div>

        </div>
      </section>
    </div>
  )
}
