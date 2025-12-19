# Sales Page Copy (Gumroad / LemonSqueezy)

## Headline
Ship a production-clean ChatGPT App + MCP server in 15 minutes.

## Subhead
A minimal, review-friendly starter kit: Streamable HTTP/SSE transport, one deterministic tool, one UI resource, Vercel-ready.

## What You Get
- Node.js + TypeScript monorepo (npm workspaces)
- Vercel-deployable MCP server exposing `GET /` (SSE) and `POST /`
- `GET /health` endpoint
- One deterministic example tool: `echo_summarize`
- One UI resource: `ui://starter/widget.html`
- Docs: privacy policy template, app metadata template, pricing, changelog

## Who It’s For
- Developers shipping ChatGPT Apps
- Teams who want an auditable starting point
- Anyone who wants a minimal MCP server without extra complexity

## Why This Is Different
- Minimal surface area
- Deterministic example tool (easy review)
- Uses official MCP TypeScript SDK Streamable HTTP transport

## FAQ
**Does it include agents or background workers?**
No. It’s intentionally minimal and deterministic.

**Does it call external APIs?**
Not by default.

**Can I add more tools/resources?**
Yes—see README for safe customization guidance.
