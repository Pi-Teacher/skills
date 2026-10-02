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

/** firecrawl v2 /scrape：markdown/html 由 formats 指定，链接需使用参数开启。 */
export class FirecrawlAdapter implements Adapter {
  readonly name = "firecrawl";

  constructor(
    private readonly key: string,
    private readonly baseURL: string,
  ) {}

  async fetch(req: FetchRequest, signal: AbortSignal): Promise<FetchResponse> {
    normalizeRequest(req);
    const body: Record<string, unknown> = {
      url: req.url,
      onlyMainContent: req.onlyMainContent,
      maxAge: 172800000, // 默认缓存 2 天（毫秒）
      timeout: req.timeoutMs,
    };
    if (req.format === "html") {
      body["formats"] = ["html"];
    } else {
      // firecrawl v2 无纯 text 格式，用 markdown 再由 --max-chars 裁剪
      body["formats"] = ["markdown"];
    }
    if (req.cacheTolerance === "no-cache") {
      body["maxAge"] = 0;
    }

    let status: number;
    let raw: string;
    try {
      const resp = await fetch(`${this.baseURL}/v2/scrape`, {
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
      throw new Error(describeFetchError(error, signal, "POST", `${this.baseURL}/v2/scrape`));
    }
    if (status >= 400) {
      throw new Error(`firecrawl HTTP ${status}: ${snippet(raw)}`);
    }

    const parsed = safeParseJson<FirecrawlResponse>(raw);
    // firecrawl 抓取失败返回 200 + success=false，不依赖 HTTP 状态码；
    // 解析失败属响应异常，按 success=false 处理。
    if (!parsed?.success) {
      throw new Error(`firecrawl success=false: ${parsed?.error ?? ""}`);
    }

    const data = parsed.data ?? {};
    const content = truncate(
      (req.format === "html" ? data.html : data.markdown) ?? "",
      req.maxCharacters,
    );
    if (content.trim() === "") {
      throw new Error("firecrawl 提取内容为空");
    }

    return {
      content,
      links: req.includeLinks ? (data.links ?? []).map((l) => l.url) : [],
      raw,
      provider: this.name,
    };
  }
}

interface FirecrawlResponse {
  success?: boolean;
  data?: {
    markdown?: string;
    html?: string;
    links?: Array<{url: string}>;
  };
  error?: string;
}
