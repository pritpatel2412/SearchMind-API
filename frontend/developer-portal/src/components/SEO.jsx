import { useEffect } from 'react'

export default function SEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = 'website',
  ogImage = 'https://searchmind-api.vercel.app/logo-new.png',
  schemaData = null,
}) {
  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title
      ? `${title} — SearchMind API`
      : 'SearchMind API — AI Search & Autonomous Web Agent Execution Platform'
    document.title = formattedTitle

    // Helper to safely set or create a meta tag
    const setMeta = (attribute, name, content) => {
      if (!content) return
      let el = document.querySelector(`meta[${attribute}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attribute, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    // 2. Primary Meta Tags
    if (description) {
      setMeta('name', 'description', description)
    }
    if (keywords) {
      setMeta('name', 'keywords', keywords)
    }

    // 3. Open Graph Tags
    setMeta('property', 'og:title', formattedTitle)
    if (description) setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', ogType)
    if (ogImage) setMeta('property', 'og:image', ogImage)
    if (canonicalUrl) setMeta('property', 'og:url', canonicalUrl)

    // 4. Twitter Card Tags
    setMeta('name', 'twitter:title', formattedTitle)
    if (description) setMeta('name', 'twitter:description', description)
    if (ogImage) setMeta('name', 'twitter:image', ogImage)

    // 5. Canonical Link
    const targetUrl = canonicalUrl || 'https://searchmind-api.vercel.app/'
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', targetUrl)

    // 6. Optional Dynamic JSON-LD Injection
    let scriptTag = null
    if (schemaData) {
      scriptTag = document.createElement('script')
      scriptTag.type = 'application/ld+json'
      scriptTag.innerHTML = JSON.stringify(schemaData)
      document.head.appendChild(scriptTag)
    }

    return () => {
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag)
      }
    }
  }, [title, description, keywords, canonicalUrl, ogType, ogImage, schemaData])

  return null
}
