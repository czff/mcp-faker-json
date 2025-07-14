import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { extractApiInfo, makeYAPIRequest } from "./helper";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { YAPIRes } from "./type";
import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const program = new Command();

// https://github.com/upstash/context7/blob/master/src/index.ts
program
  .option(
    "-c, --create",
    "create yapi-token.json file in the current user's home directory path"
  )
  .option("--transport <stdio|sse|http>", "transport type", "stdio")
  .option("-p, --port <number>", "port for SSE/HTTP transport", "3000")
  .allowUnknownOption() // Avoid other parameter passing errors. such as Vscode
  .parse(process.argv);

const cliOptions = program.opts<{
  create?: boolean;
  transport: string;
  port: string;
}>();

async function createMcpServer() {
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

      // 构造yapi的请求路径
      const reqUrl = `${origin}/api/interface/get?id=${apiId}&token=${token}`;

      const yapiApiData = await makeYAPIRequest<YAPIRes>(reqUrl);

      if (yapiApiData?.errcode !== 0 || !yapiApiData?.data) {
        return {
          content: [
            {
              type: "text",
              text: `获取yapi数据失败-reqUrl: ${reqUrl}`,
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
            text: "请根据以下 schema mock数据。需要注意生成数据的时候的备注，比如：发布类型；1-用户发布，2代发布；无论字段是否必须，都需要生成；如果数据类型是数组，需完整生成十条数据，对应的页码、条数得对应上，其他类型的数据只需生成一条",
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

  console.log("Faker Json Server MCP Server running on stdio");
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
  createMcpServer();
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
