# chatgpt-app-starter-kit

If you've tried to deploy a ChatGPT App backed by an MCP server and spent hours debugging why it doesn't work, you're not alone. Common issues include:

- `405 Method Not Allowed`
- `406 Not Acceptable`
- `text/event-stream` not flushing
- CORS preflight failures
- Invalid or missing MCP session ID
- Vercel Edge vs Serverless runtime confusion

This starter kit exists so you can skip those issues and start from a known-working setup.

A minimal Node.js + TypeScript starter kit for building ChatGPT Apps backed by an MCP server (Streamable HTTP + SSE) deployed to Vercel.

This repository is intentionally small and review-friendly: one deterministic tool, one UI resource, and the required MCP endpoints.

---

## Why MCP Apps Commonly Break

MCP apps fail in practice for reasons that are often not obvious from documentation alone:

- **Header expectations:** The SSE endpoint requires `Accept: text/event-stream`. Without it, you get `406 Not Acceptable`. POST requests for JSON-RPC do not require this header.
- **Session handshake requirements:** `GET /api` expects an existing session via `MCP-Session-Id`. Without a valid session, you receive "Invalid or missing session ID" errors.
- **SSE buffering and runtime mismatches:** Some runtimes (Edge vs Serverless) and proxies buffer streaming output, causing SSE events to arrive in one burst instead of streaming.
- **CORS preflight behavior:** ChatGPT preflights `OPTIONS /api` before POST or GET. If CORS headers are missing or incorrect, requests fail before reaching your handler.

Documentation often describes *what* to implement but not *how these failures manifest* in practice. This starter kit encodes the correct behavior so you can observe it directly.

---

## Docs vs This Starter Kit

**Docs approach:**
- Requires reading multiple documents across MCP, Vercel, and ChatGPT platform specs
- Easy to miss header, session, or runtime details
- Failures surface as generic HTTP or streaming errors with no clear cause

**This starter kit:**
- Encodes the minimum working setup in deployable code
- Makes MCP behavior explicit and auditable
- Serves as a known-good reference that deploys cleanly to Vercel

This is not a replacement for documentation. It is a working example you can deploy, inspect, and extend.

---

## Free vs Pro

**Free (this repo):**
- A minimal MCP + SSE server reference implementation
- One example deterministic tool
- One UI resource
- Open-source (MIT)

**Pro (paid):**

The Pro package is a time-saving bundle for developers who want to move faster with less guesswork. It includes practical examples beyond the minimal reference:

- Additional MCP tool examples (PDF, CSV, text processing)
- Submission checklist for ChatGPT Apps
- Commercial-use license notes
- Stripe / LemonSqueezy integration reference
- Ongoing updates as MCP and platform behavior evolves

Pro is intended for developers and teams who prefer working examples over starting from scratch.

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
  - `POST /api` for MCP JSON-RPC
  - `GET /api` for SSE stream (`Accept: text/event-stream`)
  - `OPTIONS /api` with CORS headers
  - `GET /api/health` → `{ "ok": true }`
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
- Ensure **Output Directory** is blank (this is not a static site)

After deploy, you’ll have a URL like:

`https://YOUR-PROJECT.vercel.app/`

### 4) Connect it in ChatGPT “Create app”
In ChatGPT:
- Go to **Create** → **Apps** → **Create app**
- Find the MCP server URL setting (sometimes labeled **Server URL** or **MCP endpoint**)
- Paste:

`https://YOUR-PROJECT.vercel.app/api`

This template exposes MCP under `/api` when deployed to Vercel.

### 5) Verify it’s alive
Open in browser:

`https://YOUR-PROJECT.vercel.app/api/health`

Expected:

```json
{"ok":true}
```

---

## Troubleshooting

## Common pitfalls (timeouts, headers, Edge vs Serverless)

- **Edge vs Node/Serverless matters for SSE:** some Edge/runtime/proxy combinations buffer output and delay flushing, making SSE look “stuck” or arrive in one burst.
- **Missing `Accept: text/event-stream` → `406`:** `GET /api` is the SSE endpoint and requires the correct `Accept` header.
- **POST /api does not require SSE `Accept`:** JSON-RPC requests (e.g. `tools/list`) should work with `Accept: application/json`, `Accept: */*`, or even no `Accept` header.
- **Missing `MCP-Session-Id` on `GET /api`:** stream attachment requires an existing session; without it you’ll see invalid/missing session errors.
- **CORS preflight must work:** ChatGPT will preflight `OPTIONS /api`; if it fails you’ll get CORS errors before any POST/GET happens.
- **Wrong path:** this template serves MCP at `/api` on Vercel; hitting `/` often returns `404` or `405` depending on your project settings.
- **Vercel Git deploy Root Directory:** for Git integration, set the project **Root Directory** to `apps/mcp-server`.
- **Timeouts / long-running tools:** keep tool execution deterministic and fast; avoid long-running calls that exceed platform/request timeouts.
- **Proxy/CDN buffering:** some intermediaries buffer streaming responses, causing SSE events to arrive all at once; test without extra proxies when debugging.

Optional quick test:

```bash
# Health check
curl -sS https://YOUR-PROJECT.vercel.app/api/health

# SSE (must include Accept; session id shown as placeholder)
curl -i \
  -H 'Accept: text/event-stream' \
  -H 'MCP-Session-Id: YOUR_SESSION_ID' \
  https://YOUR-PROJECT.vercel.app/api
```

### 405 Method Not Allowed
- You’re likely hitting the wrong path.
- This template expects MCP at `/api`.
- If you deployed `apps/mcp-server` but don’t see `/api/health`, confirm `apps/mcp-server/vercel.json` is present and deployed, and your Vercel project Root Directory is correct.

### CORS errors
- ChatGPT will preflight with `OPTIONS /api`.
- This template implements `OPTIONS /` and sets:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET,POST,OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Accept, MCP-Session-Id, Last-Event-ID`

### POST /api (JSON-RPC) should work with `Accept: application/json`
- ChatGPT publishing/verification often uses `Accept: application/json` for JSON-RPC.
- This template supports that for `POST /api` (and does not require `text/event-stream` on POST).

### GET /api not streaming (SSE)
- Your client must send `Accept: text/event-stream`.
- Without that header, the server responds with `406 Not Acceptable`.

### “Invalid or missing session ID” on GET /api
- Streamable HTTP uses a session handshake.
- `GET /api` is used to attach the SSE stream for an existing session; it requires an `MCP-Session-Id` header.

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
