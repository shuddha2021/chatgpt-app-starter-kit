import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as z from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';

function summarizeDeterministically(text: string) {
  const normalized = text.replace(/\r\n/g, '\n');
  const trimmed = normalized.trim();
  const charCount = normalized.length;
  const lineCount = normalized === '' ? 0 : normalized.split('\n').length;
  const words = trimmed === '' ? [] : trimmed.split(/\s+/);
  const wordCount = words.length;
  const firstLine = (normalized.split('\n')[0] ?? '').slice(0, 200);
  const preview = trimmed.slice(0, 240) + (trimmed.length > 240 ? '…' : '');

  return {
    preview,
    stats: {
      charCount,
      wordCount,
      lineCount
    },
    firstLine
  };
}

export function createMcpServer() {
  const server = new McpServer({
    name: 'chatgpt-app-starter-kit',
    version: '0.1.0'
  });

  server.registerTool(
    'echo_summarize',
    {
      title: 'Echo Summarize',
      description: 'Deterministically summarizes the provided text (no network calls).',
      inputSchema: {
        text: z.string().describe('Text to summarize')
      }
    },
    async ({ text }): Promise<CallToolResult> => {
      const summary = summarizeDeterministically(text);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(summary, null, 2)
          }
        ]
      };
    }
  );

  server.registerResource(
    'starter_widget',
    'ui://starter/widget.html',
    {
      title: 'Starter Widget',
      description: 'Minimal HTML widget that can render tool output.',
      mimeType: 'text/html'
    },
    async (): Promise<ReadResourceResult> => {
      const filePath = path.join(process.cwd(), 'ui', 'starter', 'widget.html');
      const html = await fs.readFile(filePath, 'utf8');
      return {
        contents: [
          {
            uri: 'ui://starter/widget.html',
            text: html
          }
        ]
      };
    }
  );

  return server;
}
