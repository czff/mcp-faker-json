import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { YAPIRes } from "./type";

async function makeRequest<T>(url: string): Promise<T | null> {
  const headers = {
    Accept: "application/json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making YAPI request:", error);
    return null;
  }
}

export async function makeYapiRequest(
  origin: string,
  apiId: string,
  token: string
) {
  // 构造yapi的请求路径
  const reqUrl = `${origin}/api/interface/get?id=${apiId}&token=${token}`;
  return await makeRequest<YAPIRes>(reqUrl);
}

export function extractYapiIds(
  url: string
): { projectId: string; apiId: string } | null {
  const match = url.match(/project\/(\d+)\/interface\/api\/(\d+)/);
  if (!match) return null;

  const [, projectId, apiId] = match;
  return { projectId, apiId };
}

export function extractApiInfo(url: string) {
  try {
    const urlInfo = new URL(url);
    const { apiId, projectId } = extractYapiIds(urlInfo.pathname) || {};
    if (!apiId || !urlInfo.origin) {
      return {
        error: true,
        message: `不合法的URL， 未监测到API ID`,
      };
    }

    // 1. url参数
    let token = urlInfo.searchParams.get("token");

    // 2. 配置文件查找（优先YAPI_TOKEN_CONFIG，否则~/yapi-token.json）
    if (!token && projectId) {
      try {
        const configPath =
          process.env.YAPI_TOKEN_CONFIG ||
          path.join(os.homedir(), "yapi-token.json");
        if (fs.existsSync(configPath)) {
          const configRaw = fs.readFileSync(configPath, "utf-8");
          const config = JSON.parse(configRaw);
          if (config[projectId] && config[projectId]) {
            token = config[projectId];
          }
        }
      } catch (e) {
        // 配置文件读取失败忽略
      }
    }

    // 3. 环境变量
    if (!token && process.env.YAPI_TOKEN) {
      token = process.env.YAPI_TOKEN;
    }

    if (!token) {
      return {
        error: true,
        message: "未检测到token，请检查URL格式、用户配置文件或环境变量",
      };
    }

    return {
      error: false,
      origin: urlInfo.origin,
      apiId,
      token,
    };
  } catch (error) {
    return {
      error: true,
      message: (error as any)?.message ?? "err in extractApiInfo",
    };
  }
}
