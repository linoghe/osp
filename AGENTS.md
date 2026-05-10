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

---

## Google Workspace Integration for AI Agents

OSP uses Google Workspace exclusively. To let an AI agent (OpenAI Codex, ChatGPT, etc.) read and write Google Sheets, Drive, Calendar, and other Workspace products, you need to connect via MCP.

### Option A: Google's Official Remote MCP Servers (Recommended)

Google provides hosted remote MCP servers for each Workspace product. No local server to install — just configure your agent to connect via HTTP.

| Product | Remote MCP URL |
|---|---|
| Google Drive | `https://drivemcp.googleapis.com/mcp/v1` |
| Google Calendar | `https://calendarmcp.googleapis.com/mcp/v1` |
| Gmail | `https://gmailmcp.googleapis.com/mcp/v1` |
| Google Chat | `https://chatmcp.googleapis.com/mcp/v1` |
| People / Contacts | `https://people.googleapis.com/mcp/v1` |

Google Sheets is accessed through the **Drive MCP server** (`drive.read_file_content`, `drive.search_files`).

#### Setup steps

1. **Create a Google Cloud project** (or use an existing one)
   - Go to https://console.cloud.google.com

2. **Enable the APIs and MCP services**
   ```bash
   gcloud services enable \
     gmail.googleapis.com \
     drive.googleapis.com \
     calendar-json.googleapis.com \
     chat.googleapis.com \
     people.googleapis.com \
     gmailmcp.googleapis.com \
     drivemcp.googleapis.com \
     calendarmcp.googleapis.com \
     chatmcp.googleapis.com \
     --project=YOUR_PROJECT_ID
   ```

3. **Set up OAuth consent screen**
   - Go to Google Auth Platform > Branding in the Cloud Console
   - Add required scopes (see below)
   - Add yourself as a test user if the app is in "Testing" mode

4. **Create an OAuth 2.0 Client ID**
   - For **Codex CLI**: Create a "Desktop app" client
   - For **Claude / web-based agents**: Create a "Web application" client with the appropriate redirect URI
   - Copy the Client ID and Client Secret

5. **Configure your agent** (see platform-specific instructions below)

#### OAuth scopes you'll need

For this project, you primarily need **Sheets (via Drive)** access. Add more as needed.

**Minimum (Sheets read/write):**
```
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/spreadsheets
```

**Full Workspace (if the agent needs email, calendar, etc.):**
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.compose
https://www.googleapis.com/auth/drive.readonly
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/calendar.events.readonly
https://www.googleapis.com/auth/calendar.events.freebusy
https://www.googleapis.com/auth/chat.messages.readonly
https://www.googleapis.com/auth/chat.messages.create
```

### Option B: Local MCP Server (STDIO)

If you prefer a local server (runs as a process on your machine), use the community `mcp-google-sheets` package:

```bash
npm install -g @anthropic/mcp-google-sheets
```

This requires OAuth2 Desktop App credentials. The included `auth-sheets.js` script handles the one-time OAuth flow:

```bash
# One-time setup: install googleapis for the auth script
npm install googleapis

# Run the auth flow (opens browser for consent)
node auth-sheets.js

# This saves tokens to ~/.config/gcloud/sheets-mcp-token.json
```

Then configure your agent to use the STDIO server.

---

## Configuring OpenAI Codex

OpenAI Codex stores MCP configuration in `~/.codex/config.toml` (global) or `.codex/config.toml` (project-scoped).

### Using Google's Remote MCP Servers with Codex

Add to `~/.codex/config.toml`:

```toml
# Google Drive (includes Sheets access)
[mcp_servers.google-drive]
url = "https://drivemcp.googleapis.com/mcp/v1"

# Google Sheets (direct read/write via local STDIO server)
# Use this instead of Drive if you want cell-level Sheets operations
[mcp_servers.google-sheets]
command = "npx"
args = ["-y", "@anthropic/mcp-google-sheets"]

[mcp_servers.google-sheets.env]
CREDENTIALS_PATH = "/path/to/your/sheets-mcp-oauth.json"
TOKEN_PATH = "/path/to/your/sheets-mcp-token.json"

# Optional: Gmail, Calendar, Chat
[mcp_servers.gmail]
url = "https://gmailmcp.googleapis.com/mcp/v1"

[mcp_servers.google-calendar]
url = "https://calendarmcp.googleapis.com/mcp/v1"
```

### Authenticate remote servers

```bash
codex mcp login google-drive
codex mcp login gmail
codex mcp login google-calendar
```

Each command opens a browser for OAuth consent. You only need to do this once.

### Verify the connection

```bash
codex mcp list
```

You should see green status indicators for each configured server.

### Project-scoped config

For this project specifically, you can create `.codex/config.toml` in the repo root:

```toml
# Project-specific: Google Sheets for the pricing model
[mcp_servers.google-sheets]
command = "npx"
args = ["-y", "@anthropic/mcp-google-sheets"]

[mcp_servers.google-sheets.env]
CREDENTIALS_PATH = "/path/to/your/sheets-mcp-oauth.json"
TOKEN_PATH = "/path/to/your/sheets-mcp-token.json"
```

---

## Key Sheet Reference for Agents

When connected, the agent can read/write the pricing sheet directly.

**Sheet ID:** `1FfICAZMobv50akjHXcW-HYN7EBOOaIwSMStAPrYvokA`

**Common agent tasks:**
- "Add a task to the Gantt tab" → Insert a row with id, phase, task, days, start, end, dependencies, team, color
- "Change the hourly rate for Sr. Consultant" → Edit Baseline Matrix tab
- "What's the total project cost?" → Read cell T3 on the Gantt tab
- "What's OSP's margin?" → Read cell T5 on the Gantt tab
- "Zero out technical implementation costs" → Set days to 0 for all `tp-*` rows in the Gantt tab

---

## Reference Links

- [Google Workspace MCP setup guide](https://developers.google.com/workspace/guides/configure-mcp-servers)
- [OpenAI Codex MCP documentation](https://developers.openai.com/codex/mcp)
- [Google Workspace MCP + Codex walkthrough](https://thinhdanggroup.github.io/google-workspace-mcp-for-codex/)
- [Google Cloud Console](https://console.cloud.google.com)
