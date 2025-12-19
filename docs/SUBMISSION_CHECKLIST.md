# Submission Checklist (ChatGPT App)

## Technical
- MCP server URL is HTTPS and publicly reachable
- `GET /health` returns `{ "ok": true }`
- MCP root supports:
  - `POST /` (JSON-RPC)
  - `GET /` with `Accept: text/event-stream` (SSE)
  - `OPTIONS /` with correct CORS headers
- Tools are deterministic (or clearly documented)
- No secrets are hard-coded

## Content
- Privacy policy is hosted and linked
- App metadata is complete (name, description, support contact)

## Review Friendliness
- Tools have clear input schemas
- Tool outputs are minimal and auditable
- No background loops or agent frameworks
