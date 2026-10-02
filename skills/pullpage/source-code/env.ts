import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";

/**
 * .env 读取与取值工具。
 * 之所以自行解析而不是用 dotenv：只支持 KEY=VALUE / # 注释 / 引号包裹这三种写法，
 * 保持与本 skill 原 Go 实现完全一致的行为，同时避免引入运行时依赖。
 */

/**
 * 从 skill 根目录的 .env 读取键值对。
 * skill 根目录优先级：PULLPAGE_SKILL_DIR 环境变量 > 产物所在 scripts 目录的父目录 > 当前工作目录。
 * 打包产物位于 <root>/scripts/pullpage.js，故由 import.meta.dirname 上溯一级即 skill 根。
 */
export function loadEnv(): Map<string, string> {
  const root = process.env.PULLPAGE_SKILL_DIR || dirname(import.meta.dirname) || process.cwd();
  const envPath = join(root, ".env");

  let text: string;
  try {
    text = readFileSync(envPath, "utf8");
  } catch (error) {
    throw new Error(`打开 .env 失败（${envPath}）：${error instanceof Error ? error.message : String(error)}`);
  }

  const env = new Map<string, string>();
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    // 仅处理 KEY=VALUE，且 KEY 非空（等号位于行首时 i > 0 不成立）
    const i = line.indexOf("=");
    if (i > 0) {
      const key = line.slice(0, i).trim();
      // 去掉包裹值的引号，与 Go 的 strings.Trim 行为一致
      const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      env.set(key, value);
    }
  }
  return env;
}

/** 取必填 key，缺失时抛出错误提示用户到 .env 填写。 */
export function requireKey(env: Map<string, string>, key: string): string {
  const value = (env.get(key) ?? "").trim();
  if (value === "") {
    throw new Error(`缺少 ${key}；请在 skill 根目录的 .env 文件中填入`);
  }
  return value;
}

/** 取可选 key，空则返回 fallback。 */
export function envOr(env: Map<string, string>, key: string, fallback: string): string {
  const value = (env.get(key) ?? "").trim();
  return value !== "" ? value : fallback;
}
