import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { extractApiInfo, makeYapiRequest } from "../helper";
import { PROMPT_TIPS } from "../constant";

function setupServer(server: McpServer) {
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
          isError: true,
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
          isError: true,
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
          isError: true,
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
          isError: true,
        };
      }

      return {
        content: [
          ...PROMPT_TIPS,
          {
            type: "text",
            text: JSON.stringify(schema),
          },
        ],
      };
    }
  );
}

export default setupServer;
