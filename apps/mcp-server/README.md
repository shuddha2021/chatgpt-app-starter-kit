# MCP Server (Vercel)

This app deploys as Vercel Serverless Functions (Node) under `/api`:
- `POST /api` (MCP JSON-RPC)
- `GET /api` (SSE stream attach, requires `Accept: text/event-stream`)
- `OPTIONS /api` (CORS preflight)
- `GET /api/health`

Vercel project settings:
- **Root Directory**: `apps/mcp-server`
- **Output Directory**: leave blank (this is not a static site)

Local run:

```bash
npm install
npm run dev
```

Then open:
- `http://localhost:3000/health`
