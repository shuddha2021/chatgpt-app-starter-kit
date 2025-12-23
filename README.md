# chatgpt-app-starter-kit

A minimal Node.js + TypeScript starter kit for building ChatGPT Apps backed by an MCP server (Streamable HTTP + SSE) deployed to Vercel.

This repository is intentionally small and review-friendly: one deterministic tool, one UI resource, and the required MCP endpoints.

If you want the paid “Pro” package (separate download) with additional examples and practical templates (while keeping this repo open-source), see:
https://shuddho7.gumroad.com/l/fppruq

## Free vs Pro

**Free (this repo):**
- A minimal MCP + SSE server reference implementation
- One example deterministic tool
- One UI resource
- Open-source (MIT)

**Pro (paid):**
- Additional examples and templates (some available now, others added over time)
- Stripe / LemonSqueezy integration example (planned)
- License notes for commercial use
- Extra example tools (PDF, CSV, text — added over time)
- App submission checklist
- Best-effort updates as the kit evolves

Get Pro: https://shuddho7.gumroad.com/l/fppruq

## Who this is for
- Developers who want a minimal, auditable MCP server example that deploys cleanly to Vercel.
- Builders shipping a first ChatGPT App and want a working reference for Streamable HTTP + SSE.
- Teams who prefer to start from a small template instead of a large framework.

## What this is NOT
- Not an agent framework, background job system, or multi-tool suite.
- Not a UI kit or full product frontend.
- Not a guarantee of approval, uptime, or compatibility with future platform changes.

## Demo

_Add a short GIF or screenshot here showing:_
- `vercel deploy` in terminal
- ChatGPT → Create App → tool runs successfully

(Leave this as a placeholder comment for now.)

## What’s Included
- **MCP server** (Vercel deployable): `apps/mcp-server`
  - `POST /` for MCP JSON-RPC
  - `GET /` for SSE stream (`Accept: text/event-stream`)
  - `OPTIONS /` with CORS headers
  - `GET /health` → `{ "ok": true }`
  - Registers:
    - `tools/list`, `tools/call`
    - `resources/list`, `resources/read`
  - One deterministic tool: `echo_summarize`
  - One UI resource: `ui://starter/widget.html`
- **Optional local demo**: `apps/web` (simple page explaining the template)
- **Docs & templates**: `docs/`

---

## 15-minute Quickstart

### 0) Prereqs
- Node.js 20+
- A Vercel account

### 1) Install dependencies
From repo root:

```bash
npm install
```

### 2) Build everything (sanity check)

```bash
npm run build
```

### 3) Deploy MCP server to Vercel
Option A (Vercel CLI):

```bash
cd apps/mcp-server
npx vercel
```

Option B (Git integration):
- Push this repo to GitHub
- Import the project in Vercel
- Set the **Root Directory** to `apps/mcp-server`

After deploy, you’ll have a URL like:

`https://YOUR-PROJECT.vercel.app/`

### 4) Connect it in ChatGPT “Create app”
In ChatGPT:
- Go to **Create** → **Apps** → **Create app**
- Find the MCP server URL setting (sometimes labeled **Server URL** or **MCP endpoint**)
- Paste:

`https://YOUR-PROJECT.vercel.app/`

That root URL is correct because this template exposes MCP on `/`.

### 5) Verify it’s alive
Open in browser:

`https://YOUR-PROJECT.vercel.app/health`

Expected:

```json
{"ok":true}
```

---

## Troubleshooting

## Common pitfalls (timeouts, headers, Edge vs Serverless)

- **Edge vs Node/Serverless matters for SSE:** some Edge/runtime/proxy combinations buffer output and delay flushing, making SSE look “stuck” or arrive in one burst.
- **Missing `Accept: text/event-stream` → `406`:** `GET /` is the SSE endpoint and requires the correct `Accept` header.
- **Missing `MCP-Session-Id` on `GET /`:** stream attachment requires an existing session; without it you’ll see invalid/missing session errors.
- **CORS preflight must work:** ChatGPT will call `OPTIONS /`; if your deploy doesn’t route/handle OPTIONS correctly you’ll get CORS failures before any POST/GET happens.
- **Wrong path / root routing:** this template serves MCP on `/`; hitting the wrong path commonly returns `405 Method Not Allowed`.
- **Vercel Git deploy Root Directory:** for Git integration, set the project **Root Directory** to `apps/mcp-server`.
- **Timeouts / long-running tools:** keep tool execution deterministic and fast; avoid long-running calls that exceed platform/request timeouts.
- **Proxy/CDN buffering:** some intermediaries buffer streaming responses, causing SSE events to arrive all at once; test without extra proxies when debugging.

Optional quick test:

```bash
# Health check
curl -sS https://YOUR-PROJECT.vercel.app/health

# SSE (must include Accept; session id shown as placeholder)
curl -i \
  -H 'Accept: text/event-stream' \
  -H 'MCP-Session-Id: YOUR_SESSION_ID' \
  https://YOUR-PROJECT.vercel.app/
```

### 405 Method Not Allowed
- You’re likely hitting the wrong path.
- This template expects MCP at the **root** (`/`).
- If you deployed `apps/mcp-server` but still see `/api/...` routes, confirm `apps/mcp-server/vercel.json` is present and deployed.

### CORS errors
- ChatGPT will preflight with `OPTIONS /`.
- This template implements `OPTIONS /` and sets:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET,POST,OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Accept, MCP-Session-Id, Last-Event-ID`

### GET / not streaming (SSE)
- Your client must send `Accept: text/event-stream`.
- Without that header, the server responds with `406 Not Acceptable`.

### “Invalid or missing session ID” on GET /
- Streamable HTTP uses a session handshake.
- `GET /` is used to attach the SSE stream for an existing session; it requires an `MCP-Session-Id` header.

---

## Customizing Tools Safely (Review-Friendly)

This template is intentionally deterministic and auditable.

Guidelines:
- Validate all inputs with Zod schemas.
- Keep tools deterministic (no randomization, no network calls) unless you explicitly need them.
- Never hard-code secrets; use environment variables.
- Avoid background loops or agent-like behavior.

Where to edit:
- Add/edit tools and resources in `apps/mcp-server/src/mcp.ts`.

---

## FAQ

### Why is there a paid version if the repo is public?
This is an “open-core” style template: the working reference implementation is public (MIT), and the Pro package is a separate paid download that bundles additional examples and templates.

If you only need the minimal MCP server + one tool + one UI resource, the free repo is enough.

### Is this guaranteed to work forever?
No. MCP, ChatGPT, Vercel runtimes, and browser/client expectations can change over time. This repo is a stable reference point, but long-term compatibility is not guaranteed.

---

## Support & Updates
- **Free repo:** best-effort community support via issues/PRs.
- **Pro package:** best-effort support and updates are included for buyers, but there are no lifetime guarantees.

## Pro License Note
- The Pro version is intended for commercial use (including client work).
- You may not redistribute, repackage, or resell Pro materials (source, templates, docs) as a competing product.
- This free repository remains MIT licensed.

---

## License
MIT (see LICENSE).
