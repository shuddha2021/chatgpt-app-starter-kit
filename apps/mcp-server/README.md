# MCP Server (Vercel)

This app exposes an MCP server at the Vercel project root:
- `POST /` (MCP JSON-RPC)
- `GET /` (SSE stream, requires `Accept: text/event-stream`)
- `OPTIONS /` (CORS preflight)
- `GET /health`

Local run:

```bash
npm install
npm run dev
```

Then open:
- `http://localhost:3000/health`
