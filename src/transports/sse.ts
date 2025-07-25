import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { NAME, VERSION } from "../constant";
import setupServer from "./setupServer";

export function createSSEMcpServerImpl() {
  // Storage connection
  const connections = new Map<string, SSEServerTransport>();

  return async function createSSEMcpServer(port: number) {
    const server = new McpServer({
      name: NAME,
      version: VERSION,
    });
    setupServer(server);

    const app = express();
    app.use(express.json());

    app.get("/sse", async (req, res) => {
      const transport = new SSEServerTransport("/messages", res);
      const sessionId = transport.sessionId;

      connections.set(sessionId, transport);

      req.on("close", () => {
        connections.delete(sessionId);
        console.log(`SSE CLOSED: ${sessionId}`);
      });

      await server.connect(transport);
      console.log(`MCP server connection successful: ${sessionId}`);
    });

    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId as string;
      console.log(`receive client message： ${sessionId}`);

      const transport = connections.get(sessionId);

      if (transport) {
        await transport.handlePostMessage(req, res, req.body);
      } else {
        console.warn(`No active ${sessionId} connection found`);
        res.status(400).send(`No active ${sessionId} connection found`);
      }
    });

    app.listen(port, (error) => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
      console.log(
        "=========================== success ===========================\r\n",
        `APP RUN AT: ${port}`
      );
    });
  };
}

export const createSSEMcpServer = createSSEMcpServerImpl();
