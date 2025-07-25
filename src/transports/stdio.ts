import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NAME, VERSION } from "../constant";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import setupServer from "./setupServer";

export async function createStdioMcpServer() {
  const server = new McpServer({
    name: NAME,
    version: VERSION,
  });

  setupServer(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
