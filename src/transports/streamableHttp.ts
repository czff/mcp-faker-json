import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import express from "express";
import { NAME, VERSION } from "../constant";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "node:crypto";
import setupServer from "./setupServer";

export async function createStreamableHttpServer(port: number) {
  const app = express();
  app.use(express.json());

  const server = new McpServer({
    name: NAME,
    version: VERSION,
  });
  setupServer(server);

  // Map to store transports by session ID
  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.post("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.get(sessionId)) {
      // Reuse existing transport
      transport = transports.get(sessionId)!;
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized(sessionId) {
          transports.set(sessionId, transport);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          transports.delete(transport.sessionId);
        }
      };

      await server.connect(transport);
      console.log(`MCP server connection successful: ${sessionId}`);
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  });

  async function handleSessionRequest(
    req: express.Request,
    res: express.Response
  ) {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports.get(sessionId)) {
      res.status(400).send("invalid or missing session ID");
      return;
    }

    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
  }

  app.get("/mcp", handleSessionRequest);

  app.delete("/mcp", handleSessionRequest);

  app.listen(port, () => {
    console.log(`MCP Streamable RUNNING AT: http://localhost:${port}`);
  });
}
