/**
 * fetch 提供商的统一抽象与跨服务商的请求/响应模型。
 * 各家协议差异（路径、字段名、鉴权头、失败判定方式）全部收敛在各自的适配器内部，
 * 调度层只依赖这里的 Adapter 接口，因此新增服务商无需改动 main.ts。
 */

/** 跨服务商统一的请求参数。每次只抓取一个 URL。 */
export interface FetchRequest {
  /** 目标 URL */
  url: string;
  /** 内容引导（exa highlights.query / tavily query） */
  query: string;
  /** markdown | text | html */
  format: string;
  /** 文本上限；0 = 不限 */
  maxCharacters: number;
  /** 仅主体内容 */
  onlyMainContent: boolean;
  /** auto | no-cache */
  cacheTolerance: string;
  /** 超时毫秒 */
  timeoutMs: number;
  /** 附带提取的链接 */
  includeLinks: boolean;
  /** tavily: basic | advanced；其他适配器忽略 */
  extractDepth: string;
  /** 指定单家：exa | tavily | jina | firecrawl；空则按默认顺序回退 */
  provider: string;
}

/** 统一响应。 */
export interface FetchResponse {
  /** 正文（markdown/text/html） */
  content: string;
  /** 可选链接 */
  links: string[];
  /** 原始响应体，便于排查 */
  raw: string;
  /** 完成的服务商名 */
  provider: string;
  /** 成本（若平台返回），形如 "$0.0123" */
  cost?: string;
}

/** fetch 提供商的统一抽象。 */
export interface Adapter {
  /** 服务商标识，也是 CLI 的 --provider 取值 */
  readonly name: string;
  /**
   * 抓取单个 URL；失败时抛出 Error，由调度层决定是否回退。
   * signal 是调度层的全局超时信号，适配器需与自身超时合并，避免父级超时后请求仍悬挂。
   */
  fetch(req: FetchRequest, signal: AbortSignal): Promise<FetchResponse>;
}

export const DEFAULT_FORMAT = "markdown";
export const DEFAULT_TIMEOUT_MS = 30000;

/** 填充请求默认值，使各适配器拿到的参数始终是完整状态。 */
export function normalizeRequest(req: FetchRequest): void {
  if (!req.format) {
    req.format = DEFAULT_FORMAT;
  }
  if (!req.cacheTolerance) {
    req.cacheTolerance = "auto";
  }
  if (!req.timeoutMs) {
    req.timeoutMs = DEFAULT_TIMEOUT_MS;
  }
  if (!req.url) {
    req.url = "(missing)";
  }
}

/**
 * 单适配器超时 = min(自身超时, 全局剩余时间)，父级中止时子级同步中止。
 * 非正的 timeoutMs 在 Go 里等价于“已过期的 context”（请求立即失败），
 * 而 AbortSignal.timeout() 不接受负数，因此这里显式退化为已中止的信号。
 */
export function adapterSignal(req: FetchRequest, parent: AbortSignal): AbortSignal {
  if (req.timeoutMs <= 0) {
    return AbortSignal.abort();
  }
  const own = AbortSignal.timeout(req.timeoutMs);
  return parent === own ? own : AbortSignal.any([parent, own]);
}

/** 错误响应体摘要，避免把整段 HTML 错误页灌进错误信息。 */
export function snippet(text: string): string {
  return text.length > 300 ? text.slice(0, 300) : text;
}

/**
 * 按 Unicode 码点截断文本上限。
 * Go 版按字节切片，中文等多字节字符可能被切坏产生乱码；这里改为按码点截断以保证输出合法。
 */
export function truncate(text: string, maxCharacters: number): string {
  if (maxCharacters <= 0) {
    return text;
  }
  const codePoints = Array.from(text);
  return codePoints.length > maxCharacters ? codePoints.slice(0, maxCharacters).join("") : text;
}

/**
 * 网络层错误转换成简洁文案，并区分被中止的两种情况以便定位。
 * 前缀带上大写开头的 HTTP 方法与目标 URL（对齐 Go net/http 的错误格式，例如 `Post "url": ...`），
 * 否则回退链上出现问题时无法判断是哪一家、哪个地址失败。
 */
export function describeFetchError(error: unknown, parent: AbortSignal, method: string, url: string): string {
  let cause: string;
  // AbortSignal.timeout 抛出的是 TimeoutError，手动 abort 或父级中止则是 AbortError
  if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
    // Go 的 context 超时统一报 context deadline exceeded，这里保持同一文案；
    // 至于是全局还是单适配器超时，由 verbose 输出区分
    cause = "context deadline exceeded";
  } else {
    cause = error instanceof Error ? error.message : String(error);
  }
  return `${goMethod(method)} "${url}": ${cause}`;
}

/** Go net/http 的方法名写法：首字母大写，其余小写（如 Post、Get）。 */
function goMethod(method: string): string {
  const lower = method.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * 宽容解析响应体：非法 JSON 返回 null。
 * 各家在 HTTP 200 时 body 本应是合法 JSON，解析失败意味着响应异常，
 * 由调用方按业务默认值处理（通常落入"无有效结果"判定），而不是直接抛错。
 */
export function safeParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
