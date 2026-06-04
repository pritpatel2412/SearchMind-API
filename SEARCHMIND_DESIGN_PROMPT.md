# SearchMind API Platform — Premium AI SaaS UI Design Prompt
> A complete, production-grade design specification for Antigravity (or any AI frontend generator).
> Study every word before generating. This is not a wireframe request — this is a product vision.

---

## 0. WHAT YOU ARE BUILDING

**SearchMind** is a developer-facing AI SaaS platform — an open-source Tavily alternative. It exposes a high-throughput web search, extraction, deep research, and async crawl API for AI agents, LangChain pipelines, LangGraph workflows, and RAG systems. The paying customers are:

- **AI engineers** integrating SearchMind into their agents
- **Startups** building RAG-backed products
- **Developers** who need clean, ranked, LLM-ready search results

The product has **four surfaces**:
1. **Public Landing Page** — Convert developers browsing alternatives
2. **Developer Portal** — API key management, usage dashboard, playground, docs
3. **Admin Dashboard** — Platform-level monitoring, user control, analytics
4. **SDK / Integration Docs page** — LangChain, LangGraph integration showcase

You are designing **ALL FOUR** as a cohesive design system.

---

## 1. BRAND IDENTITY & AESTHETIC DIRECTION

### Personality
- **Tone**: Precise. Powerful. Developer-native. Not corporate, not cute.
- **Voice**: "We're the search layer your agents deserve." Confident, minimal fluff.
- **Archetype**: Like a Bloomberg Terminal met Linear met Vercel — obsessively functional with understated beauty.

### Aesthetic Direction: **"Dark Intelligence"**
- **Primary palette**: Near-black (`#0A0B0E`) backgrounds, not pure black
- **Surface layers**: `#111318` (cards), `#16191F` (modals/sidebars), `#1E2128` (hover states)
- **Accent 1 — Electric Cyan**: `#00D4FF` — used for primary CTAs, active states, ping indicators
- **Accent 2 — Signal Amber**: `#F5A623` — used for warnings, quota alerts, rate limit indicators
- **Accent 3 — Ghost White**: `#E8EAF0` — primary body text
- **Muted Text**: `#6B7280`
- **Border/Divider**: `#1F2937` (barely visible, 1px)
- **Success Green**: `#10B981`
- **Danger Red**: `#EF4444`

### Typography System
- **Display / Hero**: `"Roobert"` or `"Neue Machina"` — geometric, cold, technical
- **Headings (H1-H3)**: `"Cabinet Grotesk"` — modern grotesque, slightly condensed
- **Body / UI text**: `"DM Mono"` for code-heavy surfaces (API keys, JSON, logs); `"Inter"` only as body fallback
- **Code / JSON / Terminal**: `"JetBrains Mono"` — mandatory for playground, logs, CLI output

### Motion Language
- All page transitions: `ease-out` cubic-bezier, ~250ms
- Card hover: subtle `translateY(-2px)` + glow `box-shadow: 0 0 20px rgba(0, 212, 255, 0.08)`
- Data loading: skeleton shimmer with dark-mode pulse (NOT spinners except for async ops)
- Chart entry animations: lines/bars draw in from left over 600ms
- Terminal output: character-by-character typewriter for API responses in playground
- Real-time indicators (Redis/Postgres health): radial pulse animation on the dot

### Visual Texture
- Subtle **noise grain overlay** on hero sections (SVG filter, ~3% opacity)
- **Grid dot pattern** as background texture on landing page hero (CSS radial-gradient, very subtle)
- **Glassmorphism** only on floating modals/tooltips: `backdrop-filter: blur(12px)`, `background: rgba(22,25,31,0.85)`, border `1px solid rgba(255,255,255,0.06)`
- **Gradient mesh blobs** (low opacity, large, blurred) as ambient depth on landing page — cyan and amber variants
- Code blocks: always with **line number gutter**, syntax highlighting, copy button, language badge

---

## 2. DESIGN SYSTEM COMPONENTS

Before building any page, generate and document these reusable components:

### 2.1 Buttons
```
[Primary]   bg:#00D4FF  text:#0A0B0E  font-weight:600  border-radius:6px  px:20px py:10px
            hover: brightness(1.1) + glow shadow  transition:150ms
[Secondary] bg:transparent  border:1px solid #1F2937  text:#E8EAF0  hover:border-#00D4FF text-#00D4FF
[Danger]    bg:transparent  border:1px solid #EF4444  text:#EF4444  hover:bg:#EF444410
[Ghost]     text:#6B7280  hover:text-#E8EAF0  no border  no bg
[CTA Large] Full-width or hero-scale. Gradient border animation on hover (border sweeps around).
```

### 2.2 Status Badges
```
[LIVE]      green dot pulse + "LIVE" text in green — for healthy services
[DEGRADED]  amber dot + amber text — Redis slowdown, provider fallback active
[DOWN]      red dot (no pulse) + red text — service unavailable
[CACHED]    cyan outline badge "↯ CACHED" — on search results, lower latency
[PLAN]      Pill badges: FREE / STARTER / PRO / ENTERPRISE — each with distinct bg tint
```

### 2.3 Metric Cards
Large number (Neue Machina display), small label below, trend arrow (↑↓) with % delta, optional sparkline. Used extensively in Admin and Developer Portal.

### 2.4 Code Block Component
- JetBrains Mono, 13px
- Dark: `#0D1117` bg, `#8B949E` line numbers
- Syntax highlighting: strings=#A8FF78, keywords=#FF79C6, numbers=#BD93F9, comments=#6272A4
- Copy button top-right: copies to clipboard, shows "Copied ✓" for 2s
- Language tag top-left (bash, python, json, etc.)
- Optional: "Run in Playground" button for API examples

### 2.5 API Key Display
```
[sm_live_••••••••••••••••••••••••••••4a2f]   [Copy]  [Revoke]
```
- Monospace, partially masked by default
- "Reveal" eye-icon to show full key (one-time action with confirmation)
- Shows: Name | Plan tier | Rate limit | Monthly usage bar | Last used

### 2.6 Usage Progress Bars
Thin (4px height), rounded. Green → Amber (at 80%) → Red (at 95%). Shows `X / Y requests` below.

### 2.7 Navigation
- **Left Sidebar (Portal/Admin)**: 240px collapsed to 56px. Icon + label. Active state: left border `3px solid #00D4FF` + subtle bg tint.
- **Top Nav (Landing)**: Blurred sticky nav. Logo left, links center, CTAs right. Transparent until scroll.

---

## 3. PAGE 1: PUBLIC LANDING PAGE

### 3.1 Navigation Bar
- Logo: "SearchMind" wordmark — custom SVG logotype, or a terminal-cursor icon (`_`) next to the name
- Nav links: Features, Integrations, Pricing, Docs, Blog
- Right: "Sign In" (ghost) + "Start for Free →" (primary CTA)
- Sticky, `backdrop-filter:blur(20px)` on scroll, 1px bottom border appears on scroll

### 3.2 Hero Section
**Layout**: Full viewport height. Two-column on desktop.

**Left column (text)**:
```
[Eyebrow tag]  AI-Native Search API  [blinking cursor █]

[H1 — 64px Neue Machina]
The search layer
your agents
actually need.

[Body — 18px, #6B7280]
Clean, ranked, LLM-ready results for LangChain,
LangGraph, and RAG pipelines. Brave → SerpAPI →
DuckDuckGo fallback. Production-grade from day one.

[CTA row]
[Start for Free →]  [View on GitHub ↗]

[Social proof row]
★ 4.9/5  |  LangChain Compatible  |  LangGraph Ready  |  <latency badge>
```

**Right column (visual)**:
A live-looking animated API response terminal. Show a mock `POST /v1/search` request flowing in, then results populating line by line (typewriter). Use real-looking JSON with cyan highlighted keys.

**Background**: Subtle grid dots + two large blurred gradient blobs (one cyan, one amber, 5% opacity). Noise grain overlay.

### 3.3 Metrics Strip
Full-width dark band just below hero. 4 metrics in a row:
```
< 200ms    |    99.9% uptime    |    3 search providers    |    2-tier caching
avg latency       guaranteed           fallback chain         Redis + PostgreSQL
```
Each with a monochrome icon, large number in Neue Machina, small label in DM Mono.

### 3.4 Feature Grid — "Everything Your Pipeline Needs"
**6-card grid (3×2 desktop, 1×6 mobile)**. Cards use glassmorphism treatment (subtle). Each card:

```
[Icon — line-style, cyan tinted]
[Feature Title — Cabinet Grotesk, 18px]
[2-line description — muted text]
[Bottom: code snippet preview — 1-2 lines, monospace]
```

Cards to include:
1. **Web Search** — "Brave → SerpAPI → DuckDuckGo fallback chain. Basic snippets or full-page extraction. Always returns clean results." `POST /v1/search`
2. **Content Extraction** — "Trafilatura + Playwright fallback. Pull clean article text from any URL, even JS-rendered pages." `POST /v1/extract`
3. **Deep Research** — "Multi-query parallel research with LLM synthesis. Deduplication, re-ranking, cited summary." `POST /v1/research`
4. **Async Crawl** — "Background domain crawl via Celery workers. Domain-scoped, depth-controlled, cached results." `POST /v1/crawl`
5. **LangChain & LangGraph** — "Drop-in `SearchMindTool` for chains. `StructuredTool` wrappers for reactive agent nodes." Code snippet showing import.
6. **2-Tier Caching** — "Redis hot cache + PostgreSQL warm cache. Auto cache warming on miss. TTL-controlled freshness." Diagram-like icon.

### 3.5 Architecture Diagram Section
**"How SearchMind Works"** — a styled horizontal flow diagram (not a Mermaid render — make it beautiful SVG or CSS):

```
[Your Agent / LangChain]
      ↓
[SearchMind API]
  ├── Redis: Rate Limit Check
  ├── Redis/PG: Cache Lookup → HIT → Return
  └── MISS → Search Providers (Brave / SerpAPI / DDG)
                   ↓
             Re-Rank Engine
                   ↓
             LLM Synthesis (Groq / NVIDIA NIM)
                   ↓
             Cache → Return
```

Nodes are styled pill/rectangles with icons. Arrows are animated (dashed line drawing from left to right, looping). Provider logos shown inline.

### 3.6 Code Integration Section
**3-tab switcher**: `Python SDK` | `LangChain` | `LangGraph`

Show realistic code for each. Large code block with syntax highlighting. Left side is code, right side is the actual JSON response output (collapsible). Tab selection is animated.

```python
# Python SDK
from searchmind import SearchMindClient

client = SearchMindClient(api_key="sm_live_...")
result = client.search(
    query="LangGraph multi-agent patterns 2025",
    num_results=5,
    search_depth="advanced",
    include_answer=True
)
print(result.answer)
```

```python
# LangChain
from searchmind.langchain_tool import SearchMindTool

tool = SearchMindTool(api_key="sm_live_...")
agent = initialize_agent([tool], llm, agent="zero-shot-react-description")
```

```python
# LangGraph
from searchmind.langgraph_tool import create_searchmind_tools

tools = create_searchmind_tools(api_key="sm_live_...")
# tools: search_web, extract_content, deep_research
graph.add_node("search", ToolNode(tools))
```

### 3.7 Pricing Section
3-column pricing table (Free / Pro / Enterprise). Cards float on dark bg.

**FREE**
```
$0 / month
1,000 req/mo
5 req/min
Basic search depth
No LLM synthesis
Community support
[Start Free]
```

**PRO** (Most Popular badge — glowing border)
```
$49 / month
100,000 req/mo
100 req/min
Advanced extraction + JS rendering
LLM answer synthesis (Groq)
Deep research endpoint
Priority support
[Get Pro →]
```

**ENTERPRISE**
```
Custom pricing
10M+ req/mo
1,000 req/min
Dedicated infrastructure
Custom LLM endpoints
SLA + dedicated support
Admin dashboard access
[Contact Sales]
```

Feature comparison matrix below the cards (collapsible on mobile).

### 3.8 Social Proof / Integrations Strip
Logos of compatible ecosystems: LangChain, LangGraph, OpenAI, Groq, NVIDIA NIM, Neon, Redis, Celery. Gray-tinted logos, colored on hover.

### 3.9 CTA Band
Full-width section. Large headline: `"Build your first agent search in < 5 minutes."` CTA button. Below: `"No credit card required. Free tier available. Docker or local setup."` Terminal command below: `docker compose up --build` (copyable).

### 3.10 Footer
4-column: Product | Developers | Company | Legal. Social icons. "Built with FastAPI, Redis, and Postgres." Copyright.

---

## 4. PAGE 2: DEVELOPER PORTAL (Authenticated)

### 4.1 Layout
- **Left sidebar** (240px): Logo top, nav items, user plan badge bottom, settings/logout
- **Main content** (fluid): Top bar with breadcrumb + "Create API Key" CTA

### 4.2 Sidebar Navigation Items
```
[≡]  SearchMind

[📊] Overview
[🔑] API Keys
[📈] Usage & Quotas
[🔬] Playground
[📚] Documentation
[⚡] Integrations
───────────────────
[⚙️] Settings
[?]  Support
[→]  Logout

[plan badge: PRO]
[user@example.com]
```

### 4.3 Overview Dashboard (Home)
**Header**: "Good morning, Prit. ☀️" (personalized greeting, time-aware)

**Top metric row (4 cards)**:
```
[Requests Today]    [Month Usage]       [Cache Hit Rate]    [Avg Latency]
   2,847               47,291/100,000       68.4%              142ms
   ↑12.3% vs yesterday  47.3% used         ↑4.1%              ↓23ms
```

**Main area (2-column)**:

LEFT (60%):
- **Request Volume Chart**: Stacked area chart, last 30 days. Lines for: Search, Extract, Research, Crawl. Hover tooltip shows breakdown. X-axis: dates. Y-axis: request count. Colors: cyan, amber, green, purple.
- **Recent Activity Feed**: Last 10 API calls. Each row: endpoint badge (colored pill) | query truncated | latency | cached indicator | timestamp.

RIGHT (40%):
- **Quota Usage** — Circular/ring chart showing monthly requests consumed. Center shows `47,291 / 100,000`. Color changes red at 80%.
- **Provider Status** — Live pings to Brave/SerpAPI/DDG. Green/amber/red dots with response times.
- **Plan Card** — Current plan name, renewal date, "Upgrade Plan" button.

### 4.4 API Keys Page
**Page header**: "API Keys" + "Create New Key →" button top right.

**Keys list** (table-style cards):

Each key row:
```
┌──────────────────────────────────────────────────────────────┐
│  Production Key                              [ACTIVE]        │
│  sm_live_7a3f••••••••••••••••••••••••4a2f  [Copy] [Reveal]  │
│                                                              │
│  Rate Limit: 100/min   Monthly: 50,000 req                  │
│  Usage: ████████░░░░░░░░  34,892 / 50,000                   │
│  Last Used: 2 min ago  Created: Jan 15, 2025                │
│                                          [Edit]  [Revoke ×] │
└──────────────────────────────────────────────────────────────┘
```

**Create Key Modal** (glassmorphism overlay):
- Key name input
- Custom rate limit (or inherit from plan)
- Custom monthly limit (or inherit)
- Expiry date optional
- On creation: shows full key in a cyan-bordered, monospaced, one-time display box with "⚠️ Save this key — it will never be shown again."

### 4.5 Usage & Quotas Page
**Header stats row**: 4 metric cards (same as overview but expanded).

**Endpoint breakdown table**:
```
Endpoint     | Requests | % of Total | Avg Latency | Cache Hit %
─────────────────────────────────────────────────────────────────
Search       | 31,482   | 66.7%      | 138ms       | 71.2%
Extract      | 9,204    | 19.5%      | 892ms       | 54.1%
Research     | 4,891    | 10.4%      | 3,210ms     | 38.7%
Crawl        | 1,714    | 3.6%       | —           | —
```

**Historical usage chart** (bar chart, month-by-month, last 6 months).

**Rate limit events** (collapsible list): Timestamps when 429s were hit.

### 4.6 Playground (Star Feature — Most Important Page)

Layout: Left panel (request builder) | Right panel (response viewer)

**LEFT PANEL — Request Builder**:
```
[Endpoint selector — styled dropdown]
  ○ POST /v1/search
  ○ POST /v1/extract
  ○ POST /v1/research
  ○ POST /v1/crawl

[Dynamic form — changes based on endpoint selected]

For /v1/search:
  Query: [text input — "Enter your search query..."]
  Num Results: [1-20 slider]
  Search Depth: [Basic ●──○ Advanced toggle]
  Include Answer: [toggle]
  [▶ Run Search]

[Generated cURL / Python / JS code block below form]
— auto-updates as form changes —
— 3 tabs: cURL | Python | JavaScript —
```

**RIGHT PANEL — Response Viewer**:
```
[Top bar: 200 OK  |  142ms  |  Cached: No  |  Provider: Brave]

[Tabs: JSON | Formatted | Raw]

JSON view:
{
  "query": "LangGraph multi-agent 2025",
  "answer": "LangGraph 0.2 introduced...",     ← AI answer highlighted
  "results": [
    {
      "title": "Building Multi-Agent Systems...",
      "url": "https://...",
      "score": 0.94,                            ← score bar inline
      "content": "..."
    }
  ]
}

Formatted view:
Shows results as cards with title, URL, score progress bar, content preview.

[Copy Response] [Download JSON] buttons
```

The entire playground has a "terminal" aesthetic — dark bg, monospace font for JSON, glowing borders on active inputs.

### 4.7 Documentation Page (In-Portal)
**Left sidebar**: Collapsible section tree — Authentication, Endpoints (/search, /extract, /research, /crawl, /usage, /health), SDK, LangChain, LangGraph, Rate Limits, Caching.

**Main content**: Each doc page has:
- Endpoint badge (METHOD + path), description
- Request/Response schema (styled table)
- Code examples in 4 languages (cURL, Python, JavaScript, TypeScript)
- Interactive "Try it" button that opens playground pre-filled

---

## 5. PAGE 3: ADMIN DASHBOARD

Different visual treatment — slightly more data-dense. Same dark base but amber accent more prominent (signals authority/warning).

### 5.1 Layout
Same sidebar structure. Admin-specific items:
```
[📊] System Overview
[👥] Users
[🔑] API Keys (all users)
[📈] Platform Analytics
[⚠️] Alerts & Errors
[🏥] System Health
[⚙️] Settings
```

### 5.2 System Overview Page
**Platform health banner** (top, full width):
```
● All Systems Operational       PostgreSQL: 12ms   Redis: 0.4ms   Brave: 98ms
```
If degraded: amber pulsing bar with "Brave Search degraded — SerpAPI fallback active".

**Metric row (6 cards)**:
```
Total Users  | Active API Keys | Requests Today | Error Rate | Cache Hit % | Avg Latency
  1,284      |    3,891        |   287,493      |  0.3%      |   67.1%     |   156ms
```

**Two big charts side by side**:
- Request throughput (line chart, last 24h — 15min intervals)
- Error distribution (donut chart: 404, 429, 503, 500 with counts)

### 5.3 Users Management Page
Table with: Avatar initials | Email | Plan badge | API Keys | Monthly Usage | Status | Joined | Actions

Actions column: "View" | "Edit Plan" | "Suspend"

**Edit Plan modal**: Select free/starter/pro/enterprise. Updates limits immediately.

**Filters bar**: Search by email, filter by plan, filter by status (active/suspended).

### 5.4 Platform Analytics Page
**Date range picker** (7d / 30d / 90d / custom).

Charts:
- **DAU/MAU chart** (line, dual axis)
- **Plan distribution** (donut chart — Free vs Starter vs Pro vs Enterprise)
- **Top queries word cloud or table** (top 20 search queries by frequency)
- **Provider fallback stats** (stacked bar: % of requests served by Brave vs SerpAPI vs DDG)
- **Endpoint usage over time** (area chart, one series per endpoint)
- **Cache performance** (Redis hit rate vs Postgres hit rate vs cold miss, 30 days)

### 5.5 System Health Page
**Live service cards** (auto-refreshes every 10 seconds):

```
┌─────────────────────────────┐   ┌─────────────────────────────┐
│  PostgreSQL                 │   │  Redis                      │
│  ● HEALTHY                  │   │  ● HEALTHY                  │
│  Latency: 11ms              │   │  Latency: 0.3ms             │
│  Pool: 8/20 connections     │   │  Memory: 142MB / 512MB      │
│  Last check: 3s ago         │   │  Keys: 48,291               │
└─────────────────────────────┘   └─────────────────────────────┘

┌─────────────────────────────┐   ┌─────────────────────────────┐
│  Brave Search               │   │  Celery Workers             │
│  ● HEALTHY                  │   │  ● HEALTHY                  │
│  Latency: 94ms              │   │  Active: 3 workers          │
│  Quota remaining: 8,241     │   │  Queue depth: 12 tasks      │
│  Last check: 3s ago         │   │  Failed (24h): 2            │
└─────────────────────────────┘   └─────────────────────────────┘
```

**Uptime history** (last 30 days, GitHub-style grid — green/amber/red squares).

---

## 6. PAGE 4: INTEGRATIONS SHOWCASE PAGE

Standalone public page or inside portal. Shows ecosystem compatibility.

### Layout
Hero: "Plug in. Don't rewrite." Subhead: "SearchMind works natively with your entire AI stack."

**Integration cards grid** (icon + name + description + "View Docs" link):
- LangChain (`SearchMindTool` drops into any chain)
- LangGraph (`StructuredTool` wrappers for multi-agent nodes)
- OpenAI SDK (compatible endpoint format)
- Groq (default LLM provider — llama-3.3-70b-specdec)
- NVIDIA NIM (alternative embeddings/completions)
- FastAPI (built on — reference app)
- Neon Postgres (serverless DB — production-ready)
- Redis (rate limiting, caching)
- Celery (async background crawl workers)
- Docker (one-command setup)

**Featured Integration Deep-Dive** — Tabbed section for LangChain and LangGraph with real code, architecture diagram, and "copy & paste" setup.

---

## 7. RESPONSIVE & MOBILE REQUIREMENTS

- All pages must be fully responsive.
- Sidebar collapses to bottom tab bar on mobile (Portal/Admin).
- Landing page hero becomes single column, code terminal scrolls horizontally.
- Playground becomes vertical (form on top, response below) on mobile.
- Metric cards become 2×2 grid on tablet, 1-column on mobile.
- Tables get horizontal scroll with pinned first column on mobile.
- All touch targets minimum 44×44px.

---

## 8. INTERACTION & UX PATTERNS

### Empty States
Never show blank boxes. Always:
- No API keys yet: "You haven't created any keys yet. → Create your first key"
- No usage data: "No requests yet. → Try the Playground"
Each empty state has an illustration (abstract, geometric, brand-colored).

### Loading States
- Initial page load: skeleton shimmer for all cards and charts
- Charts loading: subtle pulse on the chart container, axes appear first
- Playground executing: animated "Searching..." with provider name (e.g., "Querying Brave..."), then results stream in

### Error States
- API error in playground: Red-bordered response panel, error code prominent, human-readable message below
- 429 Rate Limited: Amber banner with "Rate limit hit. Resets in 47 seconds." with countdown timer
- Service degraded: System banner at top of portal pages

### Notifications / Toasts
Bottom-right. Variants: success (green), error (red), warning (amber), info (cyan). Auto-dismiss 4s. Slide in from right.

### Confirmation Dialogs
For destructive actions (Revoke API Key, Suspend User): Glassmorphism modal. Danger-colored border. Requires typing the resource name to confirm.

---

## 9. PAGE TRANSITIONS & ANIMATIONS

- **Route change**: 150ms fade + subtle upward translate on new page content
- **Sidebar active item**: Left border `clip-path` reveal animation (top to bottom, 200ms)
- **Metric cards on load**: Stagger-in (50ms delay each), `opacity 0→1` + `translateY(8px→0)`
- **Charts on view**: Draw animation triggered by Intersection Observer
- **API Key reveal**: Blur → unblur transition (not instant, 300ms)
- **Plan upgrade modal**: Scale-in from center (`scale(0.95)→1` + opacity)
- **Playground submit**: Button text changes to spinner + "Searching...", response panel fades in

---

## 10. SPECIFIC COMPONENT SPECS

### Endpoint Badges (used throughout)
```
[SEARCH]    bg:#00D4FF15  text:#00D4FF  border:1px solid #00D4FF30  font:DM Mono 11px uppercase
[EXTRACT]   bg:#A855F715  text:#A855F7  border:1px solid #A855F730
[RESEARCH]  bg:#10B98115  text:#10B981  border:1px solid #10B98130
[CRAWL]     bg:#F5A62315  text:#F5A623  border:1px solid #F5A62330
```

### Plan Tier Badges
```
[FREE]        bg:#374151  text:#9CA3AF
[STARTER]     bg:#1E3A5F  text:#60A5FA
[PRO]         bg:#14532D  text:#4ADE80
[ENTERPRISE]  bg:#3B1F5E  text:#A78BFA
```

### HTTP Method Badges
```
[POST]    bg:#22C55E20  text:#22C55E
[GET]     bg:#3B82F620  text:#3B82F6
[DELETE]  bg:#EF444420  text:#EF4444
```

### Latency Indicator Colors
```
< 200ms   → green  #10B981
200-500ms → amber  #F5A623
> 500ms   → red    #EF4444
```

---

## 11. WHAT NOT TO DO

- ❌ No purple gradients on white — this is not a generic AI startup template
- ❌ No "ChatGPT-style" white chat bubble UI anywhere
- ❌ No stock illustrations of robots, brains, or neural network blobs
- ❌ No Inter font as primary — use the type system specified above
- ❌ No "hero with laptop mockup" stock-image-style layouts
- ❌ No excessive animations that block content loading
- ❌ No vague CTAs like "Get Started" without context — use specific: "Start Building Free →" or "Open Playground →"
- ❌ No gradient text on every heading — reserve for landing hero H1 only
- ❌ No full-screen loading spinners — use skeleton states
- ❌ No floating chatbot widget — this IS the search API, meta-chatbots feel wrong

---

## 12. FILE STRUCTURE TO GENERATE

```
searchmind-ui/
├── public/
│   └── fonts/        # Neue Machina, Cabinet Grotesk, DM Mono, JetBrains Mono
├── src/
│   ├── design-system/
│   │   ├── tokens.css       # All CSS variables defined above
│   │   ├── Button.jsx
│   │   ├── Badge.jsx
│   │   ├── MetricCard.jsx
│   │   ├── CodeBlock.jsx
│   │   ├── APIKeyCard.jsx
│   │   ├── UsageBar.jsx
│   │   ├── StatusDot.jsx
│   │   └── Chart.jsx
│   ├── pages/
│   │   ├── Landing.jsx       # Public landing page (Section 3)
│   │   ├── portal/
│   │   │   ├── Overview.jsx  # Developer dashboard home (Section 4.3)
│   │   │   ├── APIKeys.jsx   # Key management (Section 4.4)
│   │   │   ├── Usage.jsx     # Quota/usage page (Section 4.5)
│   │   │   ├── Playground.jsx# API playground (Section 4.6)
│   │   │   └── Docs.jsx      # In-portal docs (Section 4.7)
│   │   ├── admin/
│   │   │   ├── Overview.jsx  # Admin home (Section 5.2)
│   │   │   ├── Users.jsx     # User management (Section 5.3)
│   │   │   ├── Analytics.jsx # Platform analytics (Section 5.4)
│   │   │   └── Health.jsx    # System health (Section 5.5)
│   │   └── Integrations.jsx  # Integrations page (Section 6)
│   └── layout/
│       ├── Sidebar.jsx
│       ├── TopBar.jsx
│       └── PortalLayout.jsx
```

---

## 13. PRIORITY ORDER FOR GENERATION

If generating incrementally, build in this order:
1. Design tokens + component library (`tokens.css`, Button, Badge, MetricCard, CodeBlock)
2. Landing page (full, hero through footer)
3. Developer Portal: Overview dashboard + API Keys page
4. Developer Portal: Playground (most complex, most impressive)
5. Developer Portal: Usage & Docs
6. Admin: Overview + Health
7. Admin: Users + Analytics
8. Integrations page

---

## 14. FINAL DESIGN BRIEF (THE ONE SENTENCE)

> Design a dark, precision-engineered AI developer platform with the terminal aesthetic of a professional trading dashboard, the typographic confidence of a design system like Linear, and the developer ergonomics of Vercel — where every pixel earns its place and every interaction feels like it was built by engineers who genuinely use their own product.
