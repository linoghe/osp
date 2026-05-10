# Agent Rules — OSP Peer Pricing Review

## Project Overview

This is a **static HTML/CSS/JS** multi-page consulting proposal. There is no framework, no bundler, no server-side code. Each `.html` file is a self-contained page. All dynamic data comes from a Google Sheet fetched client-side.

## Critical Context

- **Do NOT install React, Vue, Next.js, or any framework.** This is intentionally vanilla HTML.
- **Do NOT add a bundler** (Webpack, Vite, Rollup, etc.). Not needed.
- **Node.js is only used for the build script** (`encrypt.js`) which encrypts pages via Staticrypt.
- The only npm dependency is `staticrypt` (devDependency). Keep it that way.

## File Structure

Every page follows the same structure:
```
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="_shared.css">
  <!-- optional page-specific <style> block -->
</head>
<body>
  <header class="app-topbar">...</header>
  <nav class="app-nav">...</nav>
  <main class="app-main">
    <div class="page-head">...</div>
    <section class="section" id="...">...</section>
    <!-- more sections -->
  </main>
  <footer class="app-footer">...</footer>
  <button class="nav-toggle" id="navToggle">...</button>
  <script>
    // Nav toggle + optional data-loading logic
  </script>
</body>
</html>
```

## Sidebar Navigation

The sidebar nav is **duplicated in every HTML file**. When adding or removing a nav link, you must update all 10 pages:
- `index.html`, `engagement.html`, `scope.html`, `scope-markdown.html`, `effort.html`, `context.html`, `questions.html`, `pricing-model.html`, `gantt.html`, `whitepaper.html`

The `active` class on the nav link varies per page.

The last nav item is an external link to the Google Sheet.

## Google Sheet — The Data Layer

**Sheet ID:** `1FfICAZMobv50akjHXcW-HYN7EBOOaIwSMStAPrYvokA`

The sheet must be **published to the web** (File → Share → Publish to web) for the site to read data.

### Fetching pattern

Every dynamic page uses this two-layer approach (always implement both):

```javascript
var SHEET_ID = '1FfICAZMobv50akjHXcW-HYN7EBOOaIwSMStAPrYvokA';

// Layer 1: Standard fetch (CSV)
fetch('https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?sheet=Gantt&headers=1&tqx=out:csv')
  .then(function(r) { return r.text(); })
  .then(function(csv) { populate(parseCSV(csv)); })
  .catch(function() {
    // Layer 2: JSONP fallback (for file:// origins / CORS issues)
    var cb = '_cb_' + Date.now();
    window[cb] = function(response) {
      delete window[cb];
      var table = response.table;
      var rows = [table.cols.map(function(c) { return c.label || ''; })];
      table.rows.forEach(function(row) {
        rows.push(row.c.map(function(cell) {
          return cell ? (cell.f || (cell.v != null ? String(cell.v) : '')) : '';
        }));
      });
      populate(rows);
    };
    var s = document.createElement('script');
    s.src = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
      '/gviz/tq?sheet=Gantt&headers=1&tqx=out:json;responseHandler:' + cb;
    document.head.appendChild(s);
  });
```

### Gantt tab task ID prefixes

| Prefix | Workstream | Pages that filter on it |
|---|---|---|
| `jam-*` | Schema Track | scope.html, effort.html, pricing-model.html |
| `md-*` | Markdown Site (OSP roles) | scope-markdown.html, effort.html, pricing-model.html |
| `tp-*` | Technical Implementation (Ext) | scope-markdown.html, effort.html, pricing-model.html |
| `pm-*`, `sr-*` | PM & Governance | effort.html, pricing-model.html |

### Team column values

| Value | Meaning |
|---|---|
| `OSP-Sr. Consultant` | Senior strategy consultant |
| `OSP-Content` | Bilingual content specialist |
| `Ext-Technical` | External/optional technical partner |
| `PM` | Project management |

To determine if a task is "technical" (optional subcontract), check if the `team` column contains `Ext`.

## Styling Rules

- All shared styles live in `_shared.css`
- Brand colors are CSS custom properties: `--c-blue`, `--c-coral`, `--c-teal`, `--c-green`, `--c-amber`, `--c-text`, `--c-text-light`, etc.
- Fonts: Source Sans 3 (body), Source Serif 4 (headings), JetBrains Mono (code/numbers)
- Page-specific styles go in a `<style>` block in that page's `<head>`
- The base font size is `20px` on `html`; use `rem` for sizing
- Currency is USD, displayed as `$X,XXX`

## Section Numbering

Sections are numbered `{page_number}.{section_number}`:
- Page 00 (Hub): sections 0.01, 0.02, 0.03, 0.04
- Page 01 (Engagement): sections 1.01, 1.02, ...
- Page 04 (Effort): sections 4.01, 4.02, 4.03

## Build & Deploy

```bash
# Install (one time)
npm install

# Build encrypted site
OSP_PASSWORD="the-password" npm run build

# Deploy: copy dist/*.html to gh-pages branch
```

The build script (`encrypt.js`):
1. Inlines `_shared.css` into each HTML file (replaces `<link>` with `<style>`)
2. Encrypts all pages with Staticrypt using a shared salt
3. Outputs to `dist/`

**Important:** After editing any HTML or CSS file, you must rebuild (`npm run build`) and redeploy for changes to appear on the live site. Dynamic data from Google Sheets updates without rebuilding.

## Common Tasks

### Change a number that's shown on the site
If the number is dynamic (has an `id` attribute like `id="schemaDays"`), edit it in the Google Sheet's Gantt tab. The site will reflect the change on next page load.

If the number is static (hardcoded in HTML), edit the HTML file directly, rebuild, and redeploy.

### Add a task to the timeline
Add a row to the Gantt tab in the Google Sheet. Use an appropriate ID prefix (`jam-`, `md-`, `tp-`, `pm-`). The Gantt chart and all summary pages will pick it up automatically.

### Change pricing / rates
Edit the Baseline Matrix tab in the Google Sheet. The Gantt tab's formulas reference it, so costs and margins recalculate automatically.

### Change the password
```bash
OSP_PASSWORD="new-password" npm run build
# Then redeploy dist/ to gh-pages
```
Users will need to re-enter the new password (old "Remember me" cookies won't work).
