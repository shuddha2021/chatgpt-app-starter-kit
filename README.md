# chatgpt-app-starter-kit

A minimal, sellable template repo for building ChatGPT Apps using an MCP server (Streamable HTTP + SSE) deployed on Vercel.

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

## License
MIT (see LICENSE).
