[toc]

# mcp-faker-json

## 背景

在前端开发过程中，我们常常需要在接口尚未完成的阶段进行 mock 数据处理。通常的做法是根据后端提供的接口文档进行开发，同时使用第三方库（如 `json-schema-faker`）生成模拟数据。然而，实际使用中常会遇到诸如枚举值缺失、字段语义不清等问题，导致 mock 数据效果不理想。

为了解决这些痛点，我们结合 `AI` 与 `MCP` 服务，自动解析接口文档，生成更贴合业务的高质量 mock 数据，大幅提升开发效率与数据真实感。

## 功能特性

- 支持通过 YApi 接口文档地址一键生成 mock 数据，智能识别类型注释，生成合理的数据
- 支持stdio/sse/http transport
- 支持命令式创建token 配置文件

## 快速开始

### 要求

- nodejs >= 18.16.1
- vscode,cursor或其他MCP客户端


### 安装

#### 在VSCode安装

将此内容添加到你的VSCode MCP配置文件`.vscode/mcp.json`中。更多信息请参见[VSCode MCP文档](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)。
```json
{
  "servers": {
    "mcpfakerjson": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-faker-json@latest"],
    }
  }
}
```
#### 在cursor安装

将此内容添加到cursor配置文件`.cursor/mcp.json`中。更多信息请参见[cursor MCP](https://docs.cursor.com/zh/context/mcp#%E5%AE%89%E8%A3%85-mcp-%E6%9C%8D%E5%8A%A1%E5%99%A8)

```json
{
  "mcpServers": {
    "faker-json": {
      "command": "npx",
      "args": ["-y", "mcp-faker-json"]
    }
  }
}
```



### 配置token

在开始使用前，需要先配置token。访问yapi文档需要token。

- 可以在url上携带。例如`https://xxx/xxx?token=xxx`

- 环境变量配置
  ```json
  {
    "servers": {
      "mcpfakerjson": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "mcp-faker-json@latest"],
        "env": {
          "YAPI_TOKEN": "xxxx"
        }
      }
    }
  }
  ```

  

- 配置文件（推荐，不同的项目会有不同的token,根据projectId映射token）。环境变量读取配置文件的路径可以偷通过环境变量配置`YAPI_TOKEN_CONFIG`，默认从`path.join(os.homedir(), ".yapi-token.json")`读取。
  ```json
  {
    "servers": {
      "mcpfakerjson": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "mcp-faker-json@latest"],
        "env": {
          "YAPI_TOKEN_CONFIG": "xxxx"
        }
      }
    }
  }
  
  // yapi-token.json内容
  {
    "项目ID": "your token"
  }
  ```

### 快速创建token配置文件

为了方便用户快速创建配置文件。可以使用提供的命令`npx mcp-faker-json@latest -c`。目前只支持默认在`path.join(os.homedir(), ".yapi-token.json")`创建。

> 1.1.1版本 支持通过读取YAPI_TOKEN_CONFIG环境变量读取路径创建


## vscode使用示例
具体参考[传送门](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
1. vscode设置启用mcp服务。打开设置页面搜索 chat mcp
2. 打开.vscode/mcp.json的文件，点击start
3. vscode右上角打开ai聊天页面
4. 聊天框 配置agent
5. 在输入框输入链接发送，并选择continue

最终ai会输出mock数据～大功告成！

## Cursor使用示例

[传送门](https://docs.cursor.com/zh/context/mcp#%E4%BD%BF%E7%94%A8-mcp-json)。可以参考官方文档这里就不再说明了。
