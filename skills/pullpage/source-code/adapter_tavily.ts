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

/** tavily /extract：提交 URL 列表后返回 raw_content（format=markdown 时即 markdown 文本）。 */
export class TavilyAdapter implements Adapter {
  readonly name = "tavily";

  constructor(
    private readonly key: string,
    private readonly baseURL: string,
  ) {}

  async fetch(req: FetchRequest, signal: AbortSignal): Promise<FetchResponse> {
    normalizeRequest(req);
    const body: Record<string, unknown> = {
      urls: [req.url],
      format: req.format,
      include_links: req.includeLinks,
    };
    if (req.query !== "") {
      body["query"] = req.query;
    }
    if (req.extractDepth !== "") {
      body["extract_depth"] = req.extractDepth; // basic | advanced
    }
    if (req.timeoutMs > 0) {
      body["timeout"] = Math.trunc(req.timeoutMs / 1000); // tavily 的 timeout 单位是秒
    }

    let status: number;
    let raw: string;
    try {
      const resp = await fetch(`${this.baseURL}/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.key}`,
        },
        body: JSON.stringify(body),
        signal: adapterSignal(req, signal),
      });
      status = resp.status;
      raw = await resp.text();
    } catch (error) {
      throw new Error(describeFetchError(error, signal, "POST", `${this.baseURL}/extract`));
    }
    if (status >= 400) {
      throw new Error(`tavily HTTP ${status}: ${snippet(raw)}`);
    }

    const parsed = safeParseJson<TavilyResponse>(raw);
    // tavily 抓取失败不依赖 HTTP 状态码，而是 200 + results 空 / failed_results 标记；
    // 200 时 body 必为合法 JSON，解析失败属异常，按空结果落入下方"无有效结果"判定。
    const results = parsed?.results ?? [];
    if (results.length === 0) {
      const reasons = (parsed?.failed_results ?? []).map((f) => `${f.url} (${f.reason})`);
      throw new Error(`tavily 无有效结果；失败：${reasons.join(", ")}`);
    }

    const content = truncate(results[0]!.raw_content ?? "", req.maxCharacters);
    // 上游 success 字段不可信，内容为空属明确失败，必须机器兜底
    if (content.trim() === "") {
      throw new Error("tavily 内容为空");
    }

    return {
      content,
      links: req.includeLinks ? (results[0]!.links ?? []) : [],
      raw,
      provider: this.name,
    };
  }
}

interface TavilyResponse {
  results?: Array<{
    url?: string;
    raw_content?: string;
    links?: string[];
  }>;
  failed_results?: Array<{url?: string; reason?: string}>;
}
