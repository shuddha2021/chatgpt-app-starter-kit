const root = document.getElementById('app');

if (!root) throw new Error('Missing #app');

root.innerHTML = `
  <main style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 16px; max-width: 900px;">
    <h1>ChatGPT App Starter Kit</h1>
    <p>This optional local demo UI explains the template and lets you render output from <code>echo_summarize</code>.</p>

    <h2>Quick checks</h2>
    <ol>
      <li>Run the MCP server locally: <code>cd apps/mcp-server && npm run dev</code></li>
      <li>Open: <a href="http://localhost:3000/health" target="_blank" rel="noreferrer">http://localhost:3000/health</a></li>
    </ol>

    <h2>Render tool output</h2>
    <p>Paste JSON (either the summary object, or an MCP tool result with <code>content[0].text</code> containing JSON).</p>
    <button id="render">Render</button>
    <span id="status" style="margin-left: 8px;"></span>
    <textarea id="input" spellcheck="false" style="width: 100%; min-height: 140px; display: block; margin-top: 8px;"></textarea>
    <pre id="output" style="background: #f6f8fa; padding: 12px; overflow: auto;"></pre>
  </main>
`;

const renderButton = document.getElementById('render') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLSpanElement;
const input = document.getElementById('input') as HTMLTextAreaElement;
const output = document.getElementById('output') as HTMLPreElement;

function normalizeToolResult(obj: unknown): unknown {
  if (obj && typeof obj === 'object') {
    const maybe = obj as { content?: Array<{ text?: string }> };
    if (Array.isArray(maybe.content) && typeof maybe.content[0]?.text === 'string') {
      try {
        return JSON.parse(maybe.content[0].text);
      } catch {
        return { rawText: maybe.content[0].text };
      }
    }
  }
  return obj;
}

renderButton.addEventListener('click', () => {
  statusEl.textContent = '';
  output.textContent = '';

  try {
    const parsed = JSON.parse(input.value);
    const normalized = normalizeToolResult(parsed);
    output.textContent = JSON.stringify(normalized, null, 2);
  } catch (err) {
    statusEl.textContent = 'Invalid JSON';
    output.textContent = String(err);
  }
});
