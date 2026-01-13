import { createHttpApp } from './http.js';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = createHttpApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`MCP server listening on http://localhost:${port}`);
});
