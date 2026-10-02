import {
  Adapter,
  FetchRequest,
  FetchResponse,
  adapterSignal,
  describeFetchError,
  normalizeRequest,
  safeParseJson,
  snippet,
  truncate,
} from "./adapter.js";

/**
 * jina reader：GET {baseURL}/{目标 URL}，默认返回 markdown。
 * 输出格式由请求头控制：Accept: application/json 时返回带正文与链接的结构化 JSON，
 * text/plain 返回纯文本，X-Return-Format: html 返回 HTML。
 */
export class JinaAdapter implements Adapter {
  readonly name = "jina";

  constructor(
    private readonly key: string,
    private readonly baseURL: string,
  ) {}

  async fetch(req: FetchRequest, signal: AbortSignal): Promise<FetchResponse> {
    normalizeRequest(req);
    const query = new URLSearchParams();
    if (req.cacheTolerance === "no-cache") {
      query.set("noCache", "true");
    }
    if (req.includeLinks) {
      query.set("withLinksSummary", "true");
    }
    if (req.timeoutMs > 0) {
      // jina 的 timeout 参数单位为秒，服务端限制上限 180
      const seconds = Math.min(180, Math.max(1, Math.trunc(req.timeoutMs / 1000)));
      query.set("timeout", `${seconds}`);
    }
    const queryString = query.toString();
    const url = `${this.baseURL}/${req.url}` + (queryString === "" ? "" : `?${queryString}`);

    const headers: Record<string, string> = {
      // jina 同时接受 Authorization: Bearer 与 x-api-key
      Authorization: `Bearer ${this.key}`,
    };
    if (req.format === "text") {
      headers["Accept"] = "text/plain";
    } else if (req.format === "html") {
      headers["X-Return-Format"] = "html";
    } else {
      headers["Accept"] = "application/json";
    }

    let status: number;
    let raw: string;
    let contentType: string;
    try {
      const resp = await fetch(url, {
        method: "GET",
        headers,
        signal: adapterSignal(req, signal),
      });
      status = resp.status;
      contentType = resp.headers.get("content-type") ?? "";
      raw = await resp.text();
    } catch (error) {
      throw new Error(describeFetchError(error, signal, "GET", url));
    }
    if (status >= 400) {
      throw new Error(`jina HTTP ${status}: ${snippet(raw)}`);
    }

    let content: string;
    let links: string[] = [];
    if (contentType.includes("application/json")) {
      // 结构形如 {"code":200,"data":{...,"content":"..."}}
      const parsed = safeParseJson<JinaResponse>(raw);
      if (parsed === null) {
        content = raw; // 解析失败按纯文本处理
      } else if (parsed.code !== 0 && parsed.code !== 200) {
        throw new Error(`jina code ${parsed.code}`);
      } else {
        content = parsed.data?.content ?? "";
        if (req.includeLinks) {
          links = (parsed.data?.links ?? []).map((l) => l.url);
        }
      }
    } else {
      content = raw;
    }

    content = truncate(content, req.maxCharacters);
    if (content.trim() === "") {
      throw new Error("jina 提取内容为空");
    }

    return {
      content,
      links,
      raw,
      provider: this.name,
    };
  }
}

interface JinaResponse {
  code?: number;
  data?: {
    title?: string;
    content?: string;
    links?: Array<{url: string; text?: string}>;
  };
}
