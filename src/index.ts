import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { extractApiInfo, makeYapiRequest } from "./helper";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { YAPIRes } from "./type";
import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

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

// HTTP/SSE port configuration
const CLI_PORT = (() => {
  const parsed = parseInt(cliOptions.port, 10);
  return isNaN(parsed) ? undefined : parsed;
})();

async function createStdioMcpServer() {
  const server = new McpServer({
    name: "faker-json",
    version: "1.0.0",
  });

  server.registerPrompt(
    "faker_json_based_on_yapi_prompt",
    {
      title: "生成mock yapi数据的prompt",
      description: "生成根据yapi的接口文档地址mock数据prompt",
      argsSchema: {
        url: z.string().describe("yapi文档地址"),
      },
    },
    ({ url }) => {
      return {
        messages: [
          {
            role: "assistant",
            content: {
              type: "text",
              text: `根据yapi接口文档地址mock数据。url: ${url}`,
            },
          },
        ],
      };
    }
  );

  server.registerTool(
    "faker_json_based_on_yapi",
    {
      title: "根据yapi接口文档地址mock数据",
      description: "根据yapi接口文档地址生成scheme，并返回让ai生成mock数据",
      inputSchema: {
        url: z.string().describe("yapi接口文档地址"),
      },
    },
    async ({ url }) => {
      const paresdUrl = extractApiInfo(url);

      if (paresdUrl.error) {
        return {
          content: [
            {
              type: "text",
              text: paresdUrl.message ?? "请检查url格式",
            },
          ],
        };
      }

      const { origin, apiId, token } = paresdUrl;
      const yapiApiData = await makeYapiRequest(origin!, apiId!, token!);

      if (yapiApiData?.errcode !== 0 || !yapiApiData?.data) {
        return {
          content: [
            {
              type: "text",
              text: `获取yapi数据失败或者文档格式有误, 请检查URL`,
            },
          ],
        };
      }

      if (!yapiApiData.data.res_body) {
        return {
          content: [
            {
              type: "text",
              text: "该接口没有返回值",
            },
          ],
        };
      }

      const schemaProperties = JSON.parse(yapiApiData.data.res_body).properties;
      const schema = schemaProperties?.data || schemaProperties;
      if (typeof schema !== "object") {
        return {
          content: [
            {
              type: "text",
              text: "抱歉～读取数据失败",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `请根据提供的JSON Schema生成模拟数据，严格遵守以下规则：
            1. 数据生成要求：
            - 必须包含所有字段，无论是否标记为必填
            - 数组类型字段：必须生成完整的10条数据
            - 非数组字段：仅生成1条数据
            - 严格遵循字段注释中的枚举值（如'发布类型：1-用户发布，2-代发布'只能生成1或2）

            2. 输出格式：
            - 保持与Schema完全一致的结构层级和字段名
            - 为重要字段添加注释且在生成在字段的正上方（如'/** 1-用户发布 */'）
            - 数组数据需确保分页字段匹配（生成10条数据时page=1, pageSize=10）

            3. 数据质量：
            - 字段值必须符合实际业务场景
            - 相同字段在不同生成结果中应保持合理差异
            - 保持内部一致性（如ID必须唯一）`,
          },
          {
            type: "text",
            text: JSON.stringify(schema),
          },
        ],
      };
    }
  );
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

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
  }
  console.log("Faker Json Server MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
