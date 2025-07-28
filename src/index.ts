import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createStdioMcpServer } from "./transports/stdio";
import { createSSEMcpServer } from "./transports/sse";
import { createStreamableHttpServer } from "./transports/streamableHttp";

const program = new Command();

const INIT_PORT = 9020;

program
  .option(
    "-c, --create",
    "create yapi-token.json file in the current user's home directory path"
  )
  .option("--transport <stdio|sse|http>", "transport type", "stdio")
  .option("-p, --port <number>", "port for SSE/HTTP transport", `${INIT_PORT}`)
  .allowUnknownOption() // Avoid other parameter passing errors. such as Vscode
  .parse(process.argv);

const cliOptions = program.opts<{
  create?: boolean;
  transport: string;
  port: string;
}>();

// Validate transport option
// Avoid errors due to parameter types when executing main functions
const allowTransports = ["stdio", "sse", "http"];
if (!allowTransports.includes(cliOptions.transport)) {
  console.error(
    `Invalid --transport value: '${cliOptions.transport}'. Must be one of: stdio, sse, http.`
  );
  process.exit(1);
}

// Transport configuration
const TRANSPORT_TYPE = (cliOptions.transport || "stdio") as
  | "stdio"
  | "http"
  | "sse";

// HTTP/SSE port configuration
const CLI_PORT = (() => {
  const parsed = parseInt(cliOptions.port, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
})();

async function createYapiTokenFile() {
  const filePath = path.join(os.homedir(), "yapi-token.json");
  if (fs.existsSync(filePath)) {
    console.log("The file already exists, no need to create it again");
    process.exit(1);
  } else {
    fs.writeFileSync(filePath, "{}", "utf-8"); // 写入空 JSON 对象
    console.log(
      "The file already created\n;mac: ～/yapi-token.json\n;window: C:Users<your user name>yapi-token.json"
    );
    process.exit(0);
  }
}

async function main() {
  if (cliOptions.create) {
    createYapiTokenFile();
    return;
  }

  const initialPort = CLI_PORT ?? INIT_PORT;
  if (TRANSPORT_TYPE === "stdio") {
    await createStdioMcpServer();
    console.log("The current MCP service connection method is stdio");
  } else if (TRANSPORT_TYPE === "sse") {
    await createSSEMcpServer(initialPort);
    console.log("The current MCP service connection method is sse");
  } else if (TRANSPORT_TYPE === "http") {
    await createStreamableHttpServer(initialPort);
    console.log("The current MCP service connection method is streamable http");
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
