# OSP Peer Pricing Review

A password-protected, multi-page consulting proposal deployed on GitHub Pages. All pricing, effort, and timeline data pull **live from a Google Sheet** — edit the sheet and the site updates on next page load.

## Quick Start

```bash
# Prerequisites: Node.js 18+ (LTS recommended)
node -v   # confirm installed

# Install
git clone https://github.com/linoghe/osp.git
cd osp
npm install

# Preview unencrypted (local dev)
npm run dev
# → opens http://localhost:3000

# Build encrypted site for deployment
OSP_PASSWORD="your-password" npm run build
# → produces dist/ with all pages encrypted

# Preview encrypted build
npm run serve
```

## Architecture

```
osp/
├── _shared.css              Shared styles (OSP branding, layout, components)
├── index.html               00 Hub — purpose, overview, document map
├── engagement.html          01 Engagement — client profile, deliverables
├── scope.html               02 Phased Scope — workstreams, schema phases
├── scope-markdown.html      03 Markdown Site — mirror track phases
├── effort.html              04 Effort & Role — days, calendar, team
├── context.html             05 Pricing Context — exclusions, commercial terms
├── questions.html           06 Pricing Guidance — recommendations, guardrails
├── pricing-model.html       07 Pricing Model — summary cards, spend bar, FTE heatmap
├── gantt.html               08 Timeline — interactive Gantt chart (Frappe Gantt)
├── whitepaper.html          09 Why a Site Mirror — strategic rationale whitepaper
├── encrypt.js               Build script: inlines CSS → encrypts via Staticrypt
├── auth-sheets.js           One-time OAuth helper for Google Sheets MCP (optional)
├── package.json             Node dependencies & scripts
└── Project Spec for Peer Review.pdf   Original brief
```

## Dependencies

| Dependency | Purpose | Required? |
|---|---|---|
| **Node.js 18+** | Runtime for the build script | Yes |
| **npm** | Package manager (comes with Node) | Yes |
| **staticrypt** (`^3.5.4`, devDependency) | AES-256 encrypts HTML pages for password protection | Yes, for build |
| **Google Sheets** (external) | Live data source for pricing, effort, timeline | Yes, at runtime in browser |

That's it. No frameworks, no bundlers, no server-side runtime. The site is **pure static HTML/CSS/JS**.

### What the site does NOT need

- No React, Vue, or any framework
- No Webpack, Vite, or bundler
- No server-side rendering
- No database
- No API keys in the repo (Sheets data is fetched from a publicly-published sheet)

## Google Sheet Connection

The Google Sheet is the single source of truth for all dynamic data:

**Sheet ID:** `1FfICAZMobv50akjHXcW-HYN7EBOOaIwSMStAPrYvokA`
**URL:** https://docs.google.com/spreadsheets/d/1FfICAZMobv50akjHXcW-HYN7EBOOaIwSMStAPrYvokA/edit

### Tabs that drive the site

| Tab | Used by | What it contains |
|---|---|---|
| **Gantt** | `effort.html`, `scope.html`, `scope-markdown.html`, `pricing-model.html`, `gantt.html` | Every task: id, phase, task name, days, start, end, dependencies, team, color, hourly rate, cost, OSP cost, margin |
| **Baseline Matrix** | Referenced by Gantt formulas | Role rates, OSP cost rates |
| **Colors** | Referenced by Gantt tab | Color assignments per team |

### How data flows

1. The sheet must be **published** (File → Share → Publish to web)
2. Each page fetches data via the Google Visualization API (JSONP) with CSV fallback
3. JavaScript in each page parses the response and updates DOM elements
4. No API key required — uses publicly-published sheet URLs

### Data fetching pattern (used on every dynamic page)

```javascript
// Try fetch (works in most contexts)
fetch('https://docs.google.com/.../gviz/tq?sheet=Gantt&headers=1&tqx=out:csv')

// Fallback to JSONP (works from file:// origins in Chrome)
var s = document.createElement('script');
s.src = '...gviz/tq?sheet=Gantt&headers=1&tqx=out:json;responseHandler:callback';
document.head.appendChild(s);
```

## Dynamic Pages — What Updates from the Sheet

| Page | Dynamic elements |
|---|---|
| **02 Phased Scope** | Workstream days (Schema, MD, Tech, PM), phase day counts (Ph 0–3) |
| **03 Markdown Site** | Phase days (MD-1 through MD-4), OSP vs Tech split, summary stats |
| **04 Effort & Role** | Stat cards (4 tracks), total days, calendar weeks, date range |
| **07 Pricing Model** | Summary cost cards, spend allocation bar chart, week-by-week FTE heatmap |
| **08 Timeline** | Full interactive Gantt chart (Frappe Gantt library via CDN) |

**Static pages** (01, 05, 06, 09) contain prose that does not change with sheet edits.

## Gantt Tab Column Reference

| Col | Header | Notes |
|---|---|---|
| A | id | Task identifier. Prefixes: `jam-` (schema), `md-` (markdown OSP), `tp-` (technical), `pm-`/`sr-` (PM/governance) |
| B | phase | Display name for the phase |
| C | task | Task description |
| D | days | Effort in business days |
| E | start | Start date (YYYY-MM-DD) |
| F | end | End date (formula: start + business days) |
| G | dependencies | Comma-separated task IDs |
| H | color | Hex color for Gantt bars |
| I | team | `OSP-Sr. Consultant`, `OSP-Content`, `Ext-Technical`, `PM` |
| J | (reserved) | |
| K | hourly_rate | Formula pulling from Baseline Matrix |
| L | cost-to-client | Formula: `8 * days * hourly_rate` |
| M | OSP cost | Formula pulling from Baseline Matrix |
| N | Margin | Formula: `cost-to-client - OSP cost` |

**Summary cells** (row 1, cols T–U area):
- `T2`: OSP Cost excluding Ext-Technical
- `T3`: Project Price excluding Ext-Technical
- `T5`: OSP Margin excluding Ext-Technical

## Encryption & Deployment

### How Staticrypt works

1. `encrypt.js` reads each HTML file
2. Inlines `_shared.css` into each page (replacing the `<link>` tag)
3. Passes all files to Staticrypt with a shared salt so "Remember me" works across pages
4. Outputs encrypted HTML to `dist/`
5. Cleans up the temporary `.prep/` directory

### Password

Set via environment variable: `OSP_PASSWORD="your-password" npm run build`
Default (if unset): `changeme`

The `--remember 7` flag lets browsers remember the password for 7 days via localStorage. All pages share one salt, so entering the password once unlocks the entire site.

### Deploy to GitHub Pages

**Manual (gh-pages branch):**
```bash
OSP_PASSWORD="your-password" npm run build
cp -r dist /tmp/osp-dist
git checkout gh-pages
cp /tmp/osp-dist/*.html .
git add -A && git commit -m "Deploy" && git push
git checkout main
```

**Automated (GitHub Actions):**
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          OSP_PASSWORD: ${{ secrets.OSP_PASSWORD }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Editing Content

### Adding or editing a page

1. Edit the HTML file directly — each page is self-contained HTML
2. All pages share `_shared.css` for layout and branding
3. Page-specific styles go in a `<style>` block in the page's `<head>`
4. Dynamic data uses inline `<script>` blocks at the bottom of the page
5. Sidebar nav is duplicated in each HTML file — update all 10 when adding a link

### Adding a new page

1. Create `new-page.html` using any existing page as a template
2. Add it to the `HTML_FILES` array in `encrypt.js`
3. Add a nav link in the `<nav class="app-nav">` block of **every** HTML file
4. Update the document map table in `index.html`
5. Update footer prev/next links on adjacent pages

### CSS architecture

- `_shared.css` uses CSS custom properties (`:root` variables) for colors, fonts, spacing
- Brand: light editorial theme (Source Sans 3, Source Serif 4, JetBrains Mono)
- Key color vars: `--c-blue`, `--c-coral`, `--c-teal`, `--c-green`, `--c-amber`
- Layout: fixed sidebar nav + scrollable main content area
- Nav collapses via `.nav-collapsed` class with localStorage persistence

### Conventions

- Section numbering: `{page}.{section}` — e.g., `4.01` is page 04, section 01
- Stat cards: `<div class="stat-card"><div class="stat-number">` + `<div class="stat-label">`
- Highlight boxes: `<div class="highlight-box">` with optional color classes (`green`, `amber`, `blue`)
- Card grids: `<div class="card-grid">` with `<div class="card card--blue">`

## Optional: Google Sheets Write Access (MCP)

`auth-sheets.js` is a one-time OAuth helper for setting up programmatic write access to the Google Sheet via Cursor's MCP server. This is only needed if you want an AI agent to edit the sheet directly — it is **not** required for the site to function.

## Troubleshooting

| Problem | Fix |
|---|---|
| CSS not loading on deployed site | Ensure `encrypt.js` is inlining CSS (it replaces `<link>` with `<style>`) |
| Password required on every page | Check "Remember me" checkbox; all pages share the same salt |
| Dynamic data not loading | Ensure the Google Sheet is published (File → Share → Publish to web) |
| Data works in Cursor browser but not Chrome | The JSONP fallback handles this; verify both fetch paths exist in the page's script |
| Gantt chart not rendering | Check that `&headers=1` is in the Google Visualization API URL |
