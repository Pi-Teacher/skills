import {
  Adapter,
  FetchRequest,
  FetchResponse,
  adapterSignal,
  describeFetchError,
  normalizeRequest,
  safeParseJson,
  snippet,
} from "./adapter.js";

/**
 * exa /contents：正文由 text 字段返回，verbosity=compact 近似"仅主体内容"。
 * maxAgeHours 置 -1 表示默认不强制 livecrawl，避免抓取变慢与额外计费。
 */
export class ExaAdapter implements Adapter {
  readonly name = "exa";

  constructor(
    private readonly key: string,
    private readonly baseURL: string,
  ) {}

  async fetch(req: FetchRequest, signal: AbortSignal): Promise<FetchResponse> {
    normalizeRequest(req);
    const body: Record<string, unknown> = {
      urls: [req.url],
      text: {verbosity: "compact"},
      maxAgeHours: -1,
      livecrawlTimeout: req.timeoutMs,
    };
    if (req.maxCharacters > 0) {
      // includeSections=body 让 exa 只回传正文段，配合 maxCharacters 省 token
      body["text"] = {
        verbosity: "compact",
        maxCharacters: req.maxCharacters,
        includeSections: ["body"],
      };
    }
    if (req.includeLinks) {
      body["extras"] = {links: 10};
    }
    if (req.query !== "") {
      body["highlights"] = {query: req.query};
    }

    let status: number;
    let raw: string;
    try {
      const resp = await fetch(`${this.baseURL}/contents`, {
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
      throw new Error(describeFetchError(error, signal, "POST", `${this.baseURL}/contents`));
    }
    if (status >= 400) {
      throw new Error(`exa HTTP ${status}: ${snippet(raw)}`);
    }

    const parsed = safeParseJson<ExaResponse>(raw);
    // exa 抓取失败返回 200 + statuses error / results 空，不依赖 HTTP 状态码；
    // 解析失败属响应异常，按零值落入下方"无有效结果"判定。
    const results = parsed?.results ?? [];
    if (results.length === 0) {
      const failed = (parsed?.statuses ?? [])
        .filter((st) => st.status !== "success")
        .map((st) => `${st.id} (${st.error?.tag})`);
      throw new Error(`exa 无有效结果；失败：${failed.join(", ")}`);
    }

    const first = results[0]!;
    let content = first.text ?? "";
    if (first.title) {
      content = `# ${first.title}\n\n${content}`;
    }
    // exa 抓取失败不依赖 HTTP 状态码，内容为空必须机器兜底
    if (content.trim() === "") {
      throw new Error("exa 内容为空");
    }

    const total = parsed?.costDollars?.total ?? 0;
    const out: FetchResponse = {
      content,
      links: req.includeLinks ? (first.extras?.links ?? []) : [],
      raw,
      provider: this.name,
    };
    if (total > 0) {
      out.cost = `$${total.toFixed(4)}`;
    }
    return out;
  }
}

interface ExaResponse {
  results?: Array<{
    url?: string;
    title?: string;
    text?: string;
    extras?: {links?: string[]};
  }>;
  statuses?: Array<{
    id?: string;
    status?: string;
    error?: {tag?: string};
  }>;
  costDollars?: {total?: number};
}
