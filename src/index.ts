import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createStdioMcpServer } from "./transports/stdio";

const program = new Command();

program
  .option(
    "-c, --create",
    "create yapi-token.json file in the current user's home directory path"
  )
  .option("--transport <stdio|sse|http>", "transport type", "stdio")
  .option("-p, --port <number>", "port for SSE/HTTP transport", "9020")
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
  if (TRANSPORT_TYPE === "stdio") {
    await createStdioMcpServer();
    console.log("Faker Json Server MCP Server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
