# 🧠 ChatGPT App Starter Kit

**Minimal, production-grade MCP + SSE starter for ChatGPT Apps on Vercel.**

A known-working reference implementation for deploying a ChatGPT App backed by a Model Context Protocol server using Streamable HTTP + SSE. One tool, one resource, zero ambiguity on headers, sessions, or CORS.

MCP apps fail in non-obvious ways. The transport layer has sharp edges that documentation describes but doesn't make visible — missing headers, session handshake ordering, runtime buffering, CORS preflight behavior. Debugging these issues can consume hours. This repository encodes the correct behavior so you can deploy, verify, and extend from a working baseline instead of reverse-engineering failures from spec documents.

---

## ✨ Why This Exists

MCP-backed ChatGPT Apps break constantly in production for reasons that have nothing to do with tool logic.

The failure modes are subtle and compound: a missing `Accept` header returns a generic `406`. A `GET` before `POST` produces a cryptic session error. An Edge runtime silently buffers SSE into a single burst. CORS preflight fails before your handler ever executes. Each of these is documented somewhere across MCP, Vercel, and ChatGPT platform specs — but the interactions between them are not.

Reading three sets of documentation and synthesizing the correct configuration is slow, error-prone work. This starter kit exists because the fastest way to understand a protocol is to observe it working.

**What this encodes:**
- The exact header, session, and CORS behavior ChatGPT expects
- Accept header normalization that handles verification flows
- A deterministic tool that isolates transport issues from logic bugs
- Path mapping between local development and Vercel deployment

**What this is not:**
- Not an agent framework, background job system, or multi-tool suite
- Not a UI kit or full product frontend
- Not a guarantee of approval, uptime, or future platform compatibility

---

## 🎬 How It Works

```
  User                        ChatGPT                      MCP Server (Vercel)
   │                            │                             │
   │  "summarize this text"     │                             │
   │ ─────────────────────────► │                             │
   │                            │  POST /api (initialize)     │
   │                            │ ───────────────────────────►│
   │                            │  ◄── MCP-Session-Id ────────│
   │                            │                             │
   │                            │  GET /api (SSE attach)      │
   │                            │ ───────────────────────────►│
   │                            │  ◄── streaming events ──────│
   │                            │                             │
   │                            │  POST /api (tools/call)     │
   │                            │ ───────────────────────────►│
   │                            │  ◄── tool result ───────────│
   │                            │                             │
   │  ◄── formatted response ──│                             │
```

1. Deploy `apps/mcp-server` to Vercel
2. Paste `https://YOUR-PROJECT.vercel.app/api` into ChatGPT → Create App
3. ChatGPT initializes a session via `POST /api`, receives `MCP-Session-Id`
4. ChatGPT attaches SSE stream via `GET /api`, calls tools via `POST /api`
5. Results stream back through the established session

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────┐
│                    ChatGPT Client                     │
│    initialize → attach stream → call tools/read UI    │
└───────────────────────┬──────────────────────────────┘
                        │  Streamable HTTP + SSE
                        ▼
┌──────────────────────────────────────────────────────┐
│              MCP Server  (apps/mcp-server)             │
│                                                        │
│   OPTIONS /api  ─────── CORS preflight (204)           │
│   POST    /api  ─────── JSON-RPC dispatch              │
│                          (initialize, tools/list,       │
│                           tools/call, resources/*)      │
│   GET     /api  ─────── SSE stream attach              │
│   GET     /api/health ─ liveness probe                 │
│                                                        │
│   ┌──────────────────┐  ┌──────────────────────────┐   │
│   │  echo_summarize   │  │  ui://starter/widget     │   │
│   │  (deterministic)  │  │  (static HTML resource)  │   │
│   └──────────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

The deployed surface is deliberately narrow — one transport, one tool, one resource. Small enough to audit in full before extending.

**Path mapping:** locally the app serves at `/` and `/health`. On Vercel, the same handlers mount at `/api` and `/api/health` via the `api/` directory convention. This distinction matters when debugging.

---

## ⚙️ Core System

### Request Flow

| Method | Path | Behavior | Required Headers |
|:---|:---|:---|:---|
| `OPTIONS` | `/api` | Returns CORS headers, `204` | — |
| `POST` | `/api` | JSON-RPC dispatch (`initialize`, `tools/list`, `tools/call`, `resources/*`) | Accept normalized automatically |
| `GET` | `/api` | Attach SSE stream to existing session | `Accept: text/event-stream`, `MCP-Session-Id` |
| `GET` | `/api/health` | `{"ok": true}` | — |

### Session Lifecycle

```
POST /api { "method": "initialize" }
  → creates StreamableHTTPServerTransport
  → assigns MCP-Session-Id (UUID)
  → stores transport in memory
  → returns session ID in response header

POST /api { "method": "tools/call" }
  → resolves transport by MCP-Session-Id header
  → dispatches to registered tool handler
  → returns JSON-RPC result

GET /api
  → resolves transport by MCP-Session-Id header
  → opens persistent SSE connection for server-push events

session close
  → removes transport from in-memory map
```

Sessions live in-memory. No external session store. No persistence across redeploys.

**Critical ordering:** `GET /api` will always fail without a prior `POST /api` initialize. Stream attachment is not the session creation step.

### Header Normalization

`POST` requests have their `Accept` header automatically normalized to include both `application/json` and `text/event-stream`. This exists because:
- ChatGPT verification flows send `Accept: application/json` for JSON-RPC
- The MCP SDK transport expects the client to accept both content types
- Without normalization, valid ChatGPT requests would be rejected

`GET` is strict: missing `Accept: text/event-stream` returns `406 Not Acceptable`. No normalization.

### CORS

Every response sets:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept, MCP-Session-Id, Last-Event-ID
```

`OPTIONS /api` returns `204` with these headers. ChatGPT will always preflight before `POST` or `GET` — if this fails, nothing else works.

### The Example Tool

`echo_summarize` accepts text and returns a deterministic summary:

```json
{
  "preview": "first 240 chars...",
  "stats": { "charCount": 142, "wordCount": 28, "lineCount": 3 },
  "firstLine": "..."
}
```

No network calls. No side effects. No randomness. If this tool fails after deployment, the problem is transport — not logic. That's the point.

---

## ⚠️ Failure Modes / Gotchas

This is the most important section. These failures are real, common, and poorly documented elsewhere.

### Headers & Protocol

| Symptom | Cause | Fix |
|:---|:---|:---|
| `406 Not Acceptable` | `GET /api` called without `Accept: text/event-stream` | Add the header. `GET` is the SSE endpoint and enforces this strictly |
| `POST /api` rejected | Client sends only `Accept: application/json` | Already handled — this starter normalizes Accept on POST. If you remove that logic, ChatGPT verification will break |
| JSON-RPC errors | Malformed request body or wrong method name | Verify payload matches MCP JSON-RPC spec (`initialize`, `tools/list`, `tools/call`) |

**Key distinction:** `POST /api` does not require `Accept: text/event-stream`. `GET /api` does. Mixing these up is the most common header mistake.

### Session Handling

| Symptom | Cause | Fix |
|:---|:---|:---|
| `Invalid or missing session ID` | `GET /api` called before `POST /api` initialized a session | Always `POST` first to receive `MCP-Session-Id`, then use it on `GET` |
| `Bad Request: No valid session ID` | `POST /api` with unknown session ID on non-initialize request | Session may have expired or server redeployed. Re-initialize |

**Session ordering is strict:** `POST /api` (initialize) → receive `MCP-Session-Id` → `GET /api` with that ID → `POST /api` with that ID for tool calls. Skipping the initialize step or losing the session ID breaks everything downstream.

### Runtime & Streaming

| Symptom | Cause | Fix |
|:---|:---|:---|
| SSE events arrive in one burst | Edge runtime or proxy buffering streaming output | Use Serverless runtime (not Edge). Test against the direct Vercel URL without intermediate proxies |
| SSE connection drops silently | Platform timeout or network interruption | Keep tool execution fast and deterministic. Avoid long-running operations that exceed request timeouts |
| SSE appears "stuck" | CDN or reverse proxy holding the connection | Bypass CDN when debugging. Verify `Transfer-Encoding: chunked` is not being rewritten |

**Edge vs Serverless matters.** Some Edge runtime and proxy combinations buffer SSE output instead of streaming it. If streaming looks broken, check your runtime configuration first.

### CORS

| Symptom | Cause | Fix |
|:---|:---|:---|
| CORS errors before any request | `OPTIONS /api` preflight not returning correct headers | This starter handles it. If you still see CORS errors, check for proxy/CDN stripping response headers |
| Works in curl but not from ChatGPT | Missing CORS headers on the actual response (not just preflight) | Ensure every response path sets CORS headers, including error responses |

ChatGPT will preflight `OPTIONS /api` before every `POST` or `GET`. If the preflight fails, the actual request never fires. You'll see a CORS error with no server-side log.

### Deployment

| Symptom | Cause | Fix |
|:---|:---|:---|
| `405 Method Not Allowed` | Wrong path — hitting `/` instead of `/api` | MCP is served at `/api` on Vercel. Confirm your URL ends with `/api` |
| `/api/health` returns 404 | Vercel Root Directory misconfigured | Set Root Directory to `apps/mcp-server`, leave Output Directory blank |
| Works locally, fails on Vercel | Path mismatch — local serves at `/`, Vercel at `/api` | Use `/api` paths for all deployed requests. Use `/` paths only for local dev |
| Deploy succeeds but nothing works | `vercel.json` not in deployed directory | Confirm `apps/mcp-server/vercel.json` exists and the Root Directory is set correctly |

### Timeouts & Execution

- Keep tool execution deterministic and fast. Vercel Serverless functions have hard timeout limits.
- Long-running tools (network calls, heavy computation) will be killed mid-execution with no graceful shutdown.
- If you need long-running operations, design tools to return quickly and provide status via subsequent calls.

### Proxy & CDN

- Intermediary proxies and CDNs may buffer streaming responses, causing SSE events to arrive all at once.
- Some proxies rewrite `Transfer-Encoding` or `Content-Type` headers, breaking SSE.
- Always test against the raw Vercel URL first. Add proxies only after confirming the baseline works.

---

## 🔧 Tech Stack

| Layer | Technology | Why |
|:---|:---|:---|
| Runtime | Node.js 20+ | Required by MCP SDK, Vercel Serverless target |
| Language | TypeScript (strict) | Explicit types for transport and tool contracts |
| MCP SDK | `@modelcontextprotocol/sdk` | Official server, transport, and type primitives |
| HTTP | Express | Predictable middleware chain for CORS + routing |
| Validation | Zod | Input schemas that serve as both LLM contract and runtime guard |
| Deployment | Vercel (Serverless) | Target platform for ChatGPT App hosting |
| Local Dev | `tsx` (watch mode) | Fast iteration without a build step |
| Demo UI | Vite + vanilla TypeScript | Optional local page for rendering tool output |

---

## 🚀 Quick Start

**Prerequisites:** Node.js 20+, a Vercel account.

### 1. Install

```bash
git clone https://github.com/shuddha2021/chatgpt-app-starter-kit.git
cd chatgpt-app-starter-kit
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Deploy

**Option A — Vercel CLI:**

```bash
cd apps/mcp-server
npx vercel
```

**Option B — Git integration:**

1. Push to GitHub
2. Import in Vercel
3. Set **Root Directory** to `apps/mcp-server`
4. Leave **Output Directory** blank

After deploy: `https://YOUR-PROJECT.vercel.app/`

### 4. Connect to ChatGPT

1. ChatGPT → Create → Apps → Create app
2. Set MCP server URL to:

```
https://YOUR-PROJECT.vercel.app/api
```

> **Note:** the path is `/api`, not `/`. This is the most common deployment mistake.

### 5. Verify

```bash
curl -sS https://YOUR-PROJECT.vercel.app/api/health
# → {"ok":true}
```

Optional SSE test (requires a valid session):

```bash
curl -i \
  -H 'Accept: text/event-stream' \
  -H 'MCP-Session-Id: YOUR_SESSION_ID' \
  https://YOUR-PROJECT.vercel.app/api
```

### Local Development

```bash
cd apps/mcp-server
npm run dev
# → http://localhost:3000
# → http://localhost:3000/health
```

Locally, paths are `/` and `/health` (not `/api`).

---

## 📁 Project Structure

```
apps/
├─ mcp-server/                          # ← deploy this
│  ├─ api/
│  │  ├─ index.ts                       # Vercel entrypoint → /api
│  │  └─ health.ts                      # Liveness probe → /api/health
│  ├─ src/
│  │  ├─ http.ts                        # CORS, session map, Accept normalization
│  │  ├─ mcp.ts                         # Tool + resource registration
│  │  └─ local.ts                       # Local dev server (port 3000)
│  ├─ ui/starter/widget.html            # UI resource served via MCP
│  └─ vercel.json                       # Deployment config
├─ web/                                 # Optional local demo page (Vite)
docs/
├─ HOW_TO_CUSTOMIZE.md                  # Extension patterns for tools/resources
├─ SUBMISSION_CHECKLIST.md              # ChatGPT App submission steps
├─ APP_METADATA_TEMPLATE.md             # App listing metadata
├─ PRIVACY_POLICY_TEMPLATE.md           # Privacy policy starting point
├─ MONETIZATION.md                      # Payment integration references
└─ CHANGELOG.md                         # Version history
```

---

## 🧩 Extensibility

### Adding Tools

All tools and resources are registered in `apps/mcp-server/src/mcp.ts`:

```typescript
server.registerTool(
  'your_tool_name',
  {
    title: 'Your Tool',
    description: 'What it does (this is what the LLM sees).',
    inputSchema: {
      query: z.string().describe('The input parameter')
    }
  },
  async ({ query }): Promise<CallToolResult> => {
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }]
    };
  }
);
```

### Adding UI Resources

1. Add an HTML file under `apps/mcp-server/ui/`
2. Register with a `ui://` URI in `mcp.ts`
3. Return file content in the resource read handler

### Design Rules

- **Validate all inputs with Zod.** The schema is both the LLM-facing contract and your runtime guard.
- **Keep tools deterministic** until you have a reason not to. Non-determinism makes transport debugging impossible.
- **Never hard-code secrets.** Use environment variables.
- **Avoid background loops or agent-like behavior.** This is a request-response server, not an autonomous agent.
- **Keep tool execution fast.** Platform timeouts will kill long-running operations without warning.
- **Verify transport before adding complexity.** Deploy the baseline, confirm it works, then extend. Adding non-deterministic tools before confirming the transport layer works makes failures ambiguous.

---

## 🗺 Roadmap

This repository is intentionally minimal and will remain so. Planned additions:

- Additional example tools demonstrating common patterns
- CI/CD configuration examples
- Platform compatibility notes as MCP and ChatGPT evolve

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

## 🗺 Roadmap

This is not growing into a framework. The intent is to stay minimal.

- [ ] Track MCP spec changes as the protocol evolves
- [ ] Add a multi-tool example without increasing deployment complexity
- [ ] Keep Vercel runtime compatibility verified

---

## 📄 License

MIT — see [LICENSE](LICENSE).

*Built by [Shuddha Chowdhury](https://github.com/shuddha2021)*
