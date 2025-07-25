# mcp-faker-json

## Features
- 目前支持根据提供的yapi接口生成mock数据

## 开始使用
### 要求
- nodejs >= 18.16.1
- vscode,cursor或其他MCP客户端

### 在VSCode安装
将此内容添加到你的VSCode MCP配置文件中。更多信息请参见[VSCode MCP文档](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)。
```json
{
  "servers": {
    "mcpfakerjson": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-faker-json"],
    }
  }
}
```
### 在cursor安装
todo...

#### 配置token
1. 会优先从url query参数读取token，例如xxx?token=xxx；
2. 如果未在链接上携带token，会从环境变量读取配置文件的路径YAPI_TOKEN_CONFIG，默认从`path.join(os.homedir(), ".yapi-token.json")`读取。
例如在vscode中定义`YAPI_TOKEN_CONFIG`
```json
{
  "servers": {
    "mcpfakerjson": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-faker-json"],
      "env": {
        "YAPI_TOKEN_CONFIG": "xxx"
      }
    }
  }
}
```
.yapi-token.json文件的定义
```json
{
    "项目ID": "your token",
}
```
项目ID是从你给予的url中提取的。提取规则`/project\/(\d+)\/interface\/api\/(\d+)/`
3. token也可在环境变量中配置单个
```json
{
  "servers": {
    "mcpfakerjson": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-faker-json"],
      "env": {
        "YAPI_TOKEN": "xxx"
      }
    }
  }
}
```

### 快速创建token配置文件
todo
