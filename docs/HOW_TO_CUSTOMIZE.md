# How to Customize

## Add a new tool
1. Edit `apps/mcp-server/src/mcp.ts`.
2. Add `server.registerTool(...)` with a Zod input schema.
3. Keep logic deterministic unless required.

## Add a new UI resource
1. Add a file under `apps/mcp-server/ui/...`.
2. Register it with a `ui://...` URI in `apps/mcp-server/src/mcp.ts`.
3. Return the file content in the resource read handler.
