import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMcpServer } from './mcp.js';

function setCors(res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, MCP-Session-Id, Last-Event-ID'
  );
}

function ensurePostAcceptHeader(req: Request) {
  const headers = req.headers as Record<string, unknown>;
  const accept = (headers['accept'] ?? '').toString();

  // Some MCP clients (including ChatGPT verification) send `Accept: application/json`.
  // The Streamable HTTP transport expects the client to accept both JSON and SSE.
  // For POST (JSON-RPC), we always respond with JSON, so we normalize the Accept
  // header to keep compatibility without requiring callers to send SSE Accept.
  if (!accept.includes('application/json') || !accept.includes('text/event-stream')) {
    const parts = new Set(
      accept
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    );
    parts.add('application/json');
    parts.add('text/event-stream');
    const normalized = Array.from(parts).join(', ');
    headers['accept'] = normalized;

    const rawHeaders = (req as any).rawHeaders as string[] | undefined;
    if (Array.isArray(rawHeaders)) {
      for (let i = rawHeaders.length - 2; i >= 0; i -= 2) {
        if (rawHeaders[i]?.toLowerCase() === 'accept') {
          rawHeaders.splice(i, 2);
        }
      }
      rawHeaders.push('Accept', normalized);
    }
  }
}

export function createHttpApp() {
  const app = createMcpExpressApp();

  const transports: Record<string, StreamableHTTPServerTransport> = {};

  app.use((req: Request, res: Response, next) => {
    setCors(res);
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/health', (_req: Request, res: Response) => {
    setCors(res);
    res.status(200).json({ ok: true });
  });

  app.post('/', async (req: Request, res: Response) => {
    setCors(res);

    try {
      ensurePostAcceptHeader(req);

      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      let transport: StreamableHTTPServerTransport;
      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: sid => {
            transports[sid] = transport;
          }
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid) delete transports[sid];
        };

        const server = createMcpServer();
        await server.connect(transport);

        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided'
          },
          id: null
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (_err) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }
    }
  });

  app.get('/', async (req: Request, res: Response) => {
    setCors(res);

    const accept = (req.headers['accept'] ?? '').toString();
    if (!accept.includes('text/event-stream')) {
      res.status(406).send('Not Acceptable: set Accept: text/event-stream');
      return;
    }

    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    await transports[sessionId].handleRequest(req, res);
  });

  return app;
}
