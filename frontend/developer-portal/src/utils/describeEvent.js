function shortUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 1
      ? u.pathname.slice(0, 24) + (u.pathname.length > 24 ? '…' : '')
      : '';
    return u.hostname.replace('www.', '') + path;
  } catch {
    return url;
  }
}

function cap(s) {
  return typeof s === 'string' ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Translates a raw SSE event into { icon, text, tone } for display.
 * Returns null for events that shouldn't appear in the text feed
 * (screenshots render in the filmstrip instead).
 */
export function describeEvent(evt) {
  if (evt.event === 'started') {
    return { icon: '🚀', text: `Starting ${evt.data.endpoint} — "${evt.data.query}"`, tone: 'default' };
  }

  if (evt.event === 'error') {
    return { icon: '⚠️', text: `Error at ${evt.data.stage}: ${evt.data.message}`, tone: 'error' };
  }

  if (evt.event === 'screenshot') {
    return null;
  }

  // Handle specific search/extract lifecycle events
  const key = `${evt.data.stage}:${evt.data.status}`;
  switch (key) {
    case 'cache:hit':
      return { icon: '⚡', text: 'Served from cache', tone: 'success' };
    case 'provider_query:start':
      return { icon: '🔍', text: `Querying ${cap(evt.data.provider)} Search…`, tone: 'default' };
    case 'provider_query:done':
      return { icon: '✓', text: `Found ${evt.data.results_found} results`, tone: 'success' };
    case 'fetch:start':
      return { icon: '🌐', text: `Fetching ${shortUrl(evt.data.url)}…`, tone: 'default' };
    case 'fetch:done':
      return { icon: '✓', text: `Fetched ${shortUrl(evt.data.url)} via ${evt.data.method}`, tone: 'success' };
    case 'extract:start':
      return { icon: '📄', text: `Extracting content from ${shortUrl(evt.data.url)}…`, tone: 'default' };
    case 'extract:done':
      return { icon: '✓', text: `Extracted ${evt.data.word_count} words (${evt.data.method}) — ${shortUrl(evt.data.url)}`, tone: 'success' };
    case 'rank:start':
      return { icon: '📊', text: 'Ranking results…', tone: 'default' };
    case 'rank:done':
      return { icon: '✓', text: `Ranked ${evt.data.ranked_count} results`, tone: 'success' };
    case 'synthesize:start':
      return { icon: '🤖', text: 'Synthesizing answer…', tone: 'default' };
    case 'synthesize:done':
      return { icon: '✓', text: 'Answer synthesized', tone: 'success' };
    default:
      if (!evt.data.stage) return { icon: 'ℹ️', text: evt.data.message || JSON.stringify(evt.data), tone: 'default' };
      return { icon: '•', text: `${cap(evt.data.stage)}: ${evt.data.status}`, tone: 'default' };
  }
}
