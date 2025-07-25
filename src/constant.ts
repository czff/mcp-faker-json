import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const PROMPT_TIPS: CallToolResult["content"] = [
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
];

export const VERSION = "1.0.0";
export const NAME = "faker-json";
