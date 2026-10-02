#!/usr/bin/env node

// env.ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
function loadEnv() {
  const root = process.env.PULLPAGE_SKILL_DIR || dirname(import.meta.dirname) || process.cwd();
  const envPath = join(root, ".env");
  let text;
  try {
    text = readFileSync(envPath, "utf8");
  } catch (error) {
    throw new Error(`\u6253\u5F00 .env \u5931\u8D25\uFF08${envPath}\uFF09\uFF1A${error instanceof Error ? error.message : String(error)}`);
  }
  const env = /* @__PURE__ */ new Map();
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const i = line.indexOf("=");
    if (i > 0) {
      const key = line.slice(0, i).trim();
      const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      env.set(key, value);
    }
  }
  return env;
}
function requireKey(env, key) {
  const value = (env.get(key) ?? "").trim();
  if (value === "") {
    throw new Error(`\u7F3A\u5C11 ${key}\uFF1B\u8BF7\u5728 skill \u6839\u76EE\u5F55\u7684 .env \u6587\u4EF6\u4E2D\u586B\u5165`);
  }
  return value;
}
function envOr(env, key, fallback) {
  const value = (env.get(key) ?? "").trim();
  return value !== "" ? value : fallback;
}

// adapter.ts
var DEFAULT_FORMAT = "markdown";
var DEFAULT_TIMEOUT_MS = 3e4;
function normalizeRequest(req) {
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
function adapterSignal(req, parent) {
  if (req.timeoutMs <= 0) {
    return AbortSignal.abort();
  }
  const own = AbortSignal.timeout(req.timeoutMs);
  return parent === own ? own : AbortSignal.any([parent, own]);
}
function snippet(text) {
  return text.length > 300 ? text.slice(0, 300) : text;
}
function truncate(text, maxCharacters) {
  if (maxCharacters <= 0) {
    return text;
  }
  const codePoints = Array.from(text);
  return codePoints.length > maxCharacters ? codePoints.slice(0, maxCharacters).join("") : text;
}
function describeFetchError(error, parent, method, url) {
  let cause;
  if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
    cause = "context deadline exceeded";
  } else {
    cause = error instanceof Error ? error.message : String(error);
  }
  return `${goMethod(method)} "${url}": ${cause}`;
}
function goMethod(method) {
  const lower = method.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// adapter_exa.ts
var ExaAdapter = class {
  constructor(key, baseURL) {
    this.key = key;
    this.baseURL = baseURL;
  }
  key;
  baseURL;
  name = "exa";
  async fetch(req, signal) {
    normalizeRequest(req);
    const body = {
      urls: [req.url],
      text: { verbosity: "compact" },
      maxAgeHours: -1,
      livecrawlTimeout: req.timeoutMs
    };
    if (req.maxCharacters > 0) {
      body["text"] = {
        verbosity: "compact",
        maxCharacters: req.maxCharacters,
        includeSections: ["body"]
      };
    }
    if (req.includeLinks) {
      body["extras"] = { links: 10 };
    }
    if (req.query !== "") {
      body["highlights"] = { query: req.query };
    }
    let status;
    let raw;
    try {
      const resp = await fetch(`${this.baseURL}/contents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.key}`
        },
        body: JSON.stringify(body),
        signal: adapterSignal(req, signal)
      });
      status = resp.status;
      raw = await resp.text();
    } catch (error) {
      throw new Error(describeFetchError(error, signal, "POST", `${this.baseURL}/contents`));
    }
    if (status >= 400) {
      throw new Error(`exa HTTP ${status}: ${snippet(raw)}`);
    }
    const parsed = safeParseJson(raw);
    const results = parsed?.results ?? [];
    if (results.length === 0) {
      const failed = (parsed?.statuses ?? []).filter((st) => st.status !== "success").map((st) => `${st.id} (${st.error?.tag})`);
      throw new Error(`exa \u65E0\u6709\u6548\u7ED3\u679C\uFF1B\u5931\u8D25\uFF1A${failed.join(", ")}`);
    }
    const first = results[0];
    let content = first.text ?? "";
    if (first.title) {
      content = `# ${first.title}

${content}`;
    }
    if (content.trim() === "") {
      throw new Error("exa \u5185\u5BB9\u4E3A\u7A7A");
    }
    const total = parsed?.costDollars?.total ?? 0;
    const out = {
      content,
      links: req.includeLinks ? first.extras?.links ?? [] : [],
      raw,
      provider: this.name
    };
    if (total > 0) {
      out.cost = `$${total.toFixed(4)}`;
    }
    return out;
  }
};

// adapter_tavily.ts
var TavilyAdapter = class {
  constructor(key, baseURL) {
    this.key = key;
    this.baseURL = baseURL;
  }
  key;
  baseURL;
  name = "tavily";
  async fetch(req, signal) {
    normalizeRequest(req);
    const body = {
      urls: [req.url],
      format: req.format,
      include_links: req.includeLinks
    };
    if (req.query !== "") {
      body["query"] = req.query;
    }
    if (req.extractDepth !== "") {
      body["extract_depth"] = req.extractDepth;
    }
    if (req.timeoutMs > 0) {
      body["timeout"] = Math.trunc(req.timeoutMs / 1e3);
    }
    let status;
    let raw;
    try {
      const resp = await fetch(`${this.baseURL}/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.key}`
        },
        body: JSON.stringify(body),
        signal: adapterSignal(req, signal)
      });
      status = resp.status;
      raw = await resp.text();
    } catch (error) {
      throw new Error(describeFetchError(error, signal, "POST", `${this.baseURL}/extract`));
    }
    if (status >= 400) {
      throw new Error(`tavily HTTP ${status}: ${snippet(raw)}`);
    }
    const parsed = safeParseJson(raw);
    const results = parsed?.results ?? [];
    if (results.length === 0) {
      const reasons = (parsed?.failed_results ?? []).map((f) => `${f.url} (${f.reason})`);
      throw new Error(`tavily \u65E0\u6709\u6548\u7ED3\u679C\uFF1B\u5931\u8D25\uFF1A${reasons.join(", ")}`);
    }
    const content = truncate(results[0].raw_content ?? "", req.maxCharacters);
    if (content.trim() === "") {
      throw new Error("tavily \u5185\u5BB9\u4E3A\u7A7A");
    }
    return {
      content,
      links: req.includeLinks ? results[0].links ?? [] : [],
      raw,
      provider: this.name
    };
  }
};

// adapter_jina.ts
var JinaAdapter = class {
  constructor(key, baseURL) {
    this.key = key;
    this.baseURL = baseURL;
  }
  key;
  baseURL;
  name = "jina";
  async fetch(req, signal) {
    normalizeRequest(req);
    const query = new URLSearchParams();
    if (req.cacheTolerance === "no-cache") {
      query.set("noCache", "true");
    }
    if (req.includeLinks) {
      query.set("withLinksSummary", "true");
    }
    if (req.timeoutMs > 0) {
      const seconds = Math.min(180, Math.max(1, Math.trunc(req.timeoutMs / 1e3)));
      query.set("timeout", `${seconds}`);
    }
    const queryString = query.toString();
    const url = `${this.baseURL}/${req.url}` + (queryString === "" ? "" : `?${queryString}`);
    const headers = {
      // jina 同时接受 Authorization: Bearer 与 x-api-key
      Authorization: `Bearer ${this.key}`
    };
    if (req.format === "text") {
      headers["Accept"] = "text/plain";
    } else if (req.format === "html") {
      headers["X-Return-Format"] = "html";
    } else {
      headers["Accept"] = "application/json";
    }
    let status;
    let raw;
    let contentType;
    try {
      const resp = await fetch(url, {
        method: "GET",
        headers,
        signal: adapterSignal(req, signal)
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
    let content;
    let links = [];
    if (contentType.includes("application/json")) {
      const parsed = safeParseJson(raw);
      if (parsed === null) {
        content = raw;
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
      throw new Error("jina \u63D0\u53D6\u5185\u5BB9\u4E3A\u7A7A");
    }
    return {
      content,
      links,
      raw,
      provider: this.name
    };
  }
};

// adapter_firecrawl.ts
var FirecrawlAdapter = class {
  constructor(key, baseURL) {
    this.key = key;
    this.baseURL = baseURL;
  }
  key;
  baseURL;
  name = "firecrawl";
  async fetch(req, signal) {
    normalizeRequest(req);
    const body = {
      url: req.url,
      onlyMainContent: req.onlyMainContent,
      maxAge: 1728e5,
      // 默认缓存 2 天（毫秒）
      timeout: req.timeoutMs
    };
    if (req.format === "html") {
      body["formats"] = ["html"];
    } else {
      body["formats"] = ["markdown"];
    }
    if (req.cacheTolerance === "no-cache") {
      body["maxAge"] = 0;
    }
    let status;
    let raw;
    try {
      const resp = await fetch(`${this.baseURL}/v2/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.key}`
        },
        body: JSON.stringify(body),
        signal: adapterSignal(req, signal)
      });
      status = resp.status;
      raw = await resp.text();
    } catch (error) {
      throw new Error(describeFetchError(error, signal, "POST", `${this.baseURL}/v2/scrape`));
    }
    if (status >= 400) {
      throw new Error(`firecrawl HTTP ${status}: ${snippet(raw)}`);
    }
    const parsed = safeParseJson(raw);
    if (!parsed?.success) {
      throw new Error(`firecrawl success=false: ${parsed?.error ?? ""}`);
    }
    const data = parsed.data ?? {};
    const content = truncate(
      (req.format === "html" ? data.html : data.markdown) ?? "",
      req.maxCharacters
    );
    if (content.trim() === "") {
      throw new Error("firecrawl \u63D0\u53D6\u5185\u5BB9\u4E3A\u7A7A");
    }
    return {
      content,
      links: req.includeLinks ? (data.links ?? []).map((l) => l.url) : [],
      raw,
      provider: this.name
    };
  }
};

// main.ts
var DEFAULT_BASE_URLS = {
  exa: "https://api.exa.ai",
  tavily: "https://api.tavily.com",
  jina: "https://r.jina.ai",
  firecrawl: "https://api.firecrawl.dev"
};
var DEFAULT_ORDER = ["tavily", "exa", "firecrawl", "jina"];
var EXIT_OK = 0;
var EXIT_FAILURE = 1;
var EXIT_USAGE = 2;
async function main() {
  const flags = parseFlags(process.argv.slice(2));
  if (flags.url === "") {
    process.stderr.write("\u9519\u8BEF\uFF1A\u7F3A\u5C11 --url\n");
    printUsage();
    process.exitCode = EXIT_USAGE;
    return;
  }
  const req = {
    url: flags.url,
    query: flags.query,
    format: flags.format,
    maxCharacters: flags.maxChars,
    onlyMainContent: flags.onlyMain,
    cacheTolerance: flags.noCache ? "no-cache" : "auto",
    timeoutMs: flags.timeout,
    includeLinks: flags.withLinks,
    extractDepth: flags.extractDepth,
    provider: flags.provider
  };
  let env = /* @__PURE__ */ new Map();
  try {
    env = loadEnv();
  } catch (error) {
    if (flags.verbose) {
      process.stderr.write(`\u8B66\u544A\uFF1A${error instanceof Error ? error.message : String(error)}
`);
    }
  }
  const globalSignal = req.timeoutMs > 0 ? AbortSignal.timeout(req.timeoutMs * 2) : AbortSignal.abort();
  if (req.provider.toLowerCase() === "all") {
    await runAll(req, env, flags.verbose, flags.withLinks, globalSignal);
    return;
  }
  const order = req.provider !== "" ? [req.provider] : DEFAULT_ORDER;
  const errors = [];
  for (const name of order) {
    const out = await tryFetch(name, env, req, flags.verbose, globalSignal);
    if (out instanceof Error) {
      errors.push(out.message);
      continue;
    }
    emitSuccess(out, flags.withLinks);
    return;
  }
  process.stderr.write("\u6240\u6709 fetch \u63D0\u4F9B\u5546\u5747\u5931\u8D25\uFF1A\n");
  for (const message of errors) {
    process.stderr.write(`  - ${message}
`);
  }
  process.exitCode = EXIT_FAILURE;
}
async function tryFetch(name, env, req, verbose, signal) {
  let adapter;
  try {
    adapter = buildAdapter(name, env);
  } catch (error) {
    return new Error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (verbose) {
    process.stderr.write(`\u5C1D\u8BD5\uFF1A ${name}
`);
  }
  try {
    const out = await adapter.fetch(req, signal);
    if (verbose) {
      process.stderr.write(`\u6210\u529F\uFF1A ${out.provider} cost: ${out.cost ?? ""}
`);
    }
    return out;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (verbose) {
      process.stderr.write(`\u5931\u8D25\uFF1A ${message}
`);
    }
    return new Error(`${name}: ${message}`);
  }
}
function emitSuccess(out, withLinks) {
  if (out.links.length > 0 && withLinks) {
    process.stdout.write(`<!-- provider: ${out.provider} -->
`);
    for (const link of out.links) {
      process.stdout.write(`-  ${link}
`);
    }
    process.stdout.write("---\n");
  }
  process.stdout.write(out.content);
}
async function runAll(req, env, verbose, withLinks, signal) {
  const settled = await Promise.all(
    DEFAULT_ORDER.map(async (name) => {
      const out = await tryFetch(name, env, req, verbose, signal);
      if (out instanceof Error) {
        return { name, content: "", links: [], error: out.message };
      }
      return { name, content: out.content, links: out.links, error: "" };
    })
  );
  const byName = new Map(settled.map((r) => [r.name, r]));
  const errors = settled.filter((r) => r.error !== "").map((r) => r.error);
  if (settled.every((r) => r.error !== "")) {
    process.stderr.write("\u6240\u6709 fetch \u63D0\u4F9B\u5546\u5747\u5931\u8D25\uFF1A\n");
    for (const message of errors) {
      process.stderr.write(`  - ${message}
`);
    }
    process.exitCode = EXIT_FAILURE;
    return;
  }
  let output = "";
  for (const name of DEFAULT_ORDER) {
    const r = byName.get(name);
    if (r.error !== "") {
      continue;
    }
    output += `=== ${name} ===
`;
    if (withLinks && r.links.length > 0) {
      for (const link of r.links) {
        output += `- ${link}
`;
      }
      output += "---\n";
    }
    output += r.content;
    if (!r.content.endsWith("\n")) {
      output += "\n";
    }
    output += "\n";
  }
  process.stdout.write(output);
}
function buildAdapter(name, env) {
  const lower = name.toLowerCase();
  switch (lower) {
    case "exa":
      return new ExaAdapter(requireKey(env, "EXA_API_KEY"), envOr(env, "EXA_BASEURL", DEFAULT_BASE_URLS.exa));
    case "tavily":
      return new TavilyAdapter(
        requireKey(env, "TAVILY_API_KEY"),
        envOr(env, "TAVILY_BASEURL", DEFAULT_BASE_URLS.tavily)
      );
    case "jina":
      return new JinaAdapter(requireKey(env, "JINA_API_KEY"), envOr(env, "JINA_BASEURL", DEFAULT_BASE_URLS.jina));
    case "firecrawl":
      return new FirecrawlAdapter(
        requireKey(env, "FIRECRAWL_API_KEY"),
        envOr(env, "FIRECRAWL_BASEURL", DEFAULT_BASE_URLS.firecrawl)
      );
    default:
      throw new Error(`\u672A\u77E5\u670D\u52A1\u5546\uFF1A${name}`);
  }
}
function parseFlags(argv) {
  const flags = {
    url: "",
    query: "",
    format: "markdown",
    maxChars: 0,
    onlyMain: true,
    // Go 版 --only-main 默认 true
    noCache: false,
    timeout: 3e4,
    withLinks: false,
    extractDepth: "",
    provider: "",
    verbose: false
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--" || arg === "-" || !arg.startsWith("-")) {
      break;
    }
    let name = arg.replace(/^-+/, "");
    let value;
    const eq = name.indexOf("=");
    if (eq >= 0) {
      value = name.slice(eq + 1);
      name = name.slice(0, eq);
    }
    if (name === "" || name.startsWith("-")) {
      flagError(`flag provided but not defined: -${name}`);
    }
    switch (name) {
      case "url":
      case "query":
      case "format":
      case "extract-depth":
      case "provider": {
        if (value === void 0) {
          if (i + 1 >= argv.length) {
            flagError(`flag needs an argument: -${name}`);
          }
          value = argv[++i];
        }
        if (name === "url") flags.url = value;
        else if (name === "query") flags.query = value;
        else if (name === "format") flags.format = value;
        else if (name === "extract-depth") flags.extractDepth = value;
        else flags.provider = value;
        break;
      }
      case "max-chars":
      case "timeout": {
        if (value === void 0) {
          if (i + 1 >= argv.length) {
            flagError(`flag needs an argument: -${name}`);
          }
          value = argv[++i];
        }
        const parsed = parseGoInt(value);
        if (parsed === null) {
          flagError(`invalid value "${value}" for flag -${name}: parse error`);
        }
        if (name === "max-chars") flags.maxChars = parsed;
        else flags.timeout = parsed;
        break;
      }
      case "only-main":
      case "no-cache":
      case "with-links":
      case "verbose": {
        let boolValue = true;
        if (value !== void 0) {
          const parsed = parseGoBool(value);
          if (parsed === null) {
            flagError(`invalid boolean value "${value}" for -${name}: parse error`);
          }
          boolValue = parsed;
        }
        if (name === "only-main") flags.onlyMain = boolValue;
        else if (name === "no-cache") flags.noCache = boolValue;
        else if (name === "with-links") flags.withLinks = boolValue;
        else flags.verbose = boolValue;
        break;
      }
      case "h":
      case "help":
        printUsage();
        process.exit(EXIT_OK);
        break;
      default:
        flagError(`flag provided but not defined: -${name}`);
    }
  }
  return flags;
}
function parseGoInt(text) {
  if (!/^[-+]?(0[xX][0-9a-fA-F]+|0[oO][0-7]+|0[bB][01]+|\d+)$/.test(text)) {
    return null;
  }
  const negative = text.startsWith("-");
  const digits = text.replace(/^[-+]/, "");
  let value;
  if (/^0[xX]/.test(digits)) {
    value = parseInt(digits.slice(2), 16);
  } else if (/^0[oO]/.test(digits)) {
    value = parseInt(digits.slice(2), 8);
  } else if (/^0[bB]/.test(digits)) {
    value = parseInt(digits.slice(2), 2);
  } else {
    value = parseInt(digits, 10);
  }
  if (!Number.isFinite(value)) {
    return null;
  }
  return negative ? -value : value;
}
function parseGoBool(text) {
  switch (text) {
    case "1":
    case "t":
    case "T":
    case "true":
    case "TRUE":
    case "True":
      return true;
    case "0":
    case "f":
    case "F":
    case "false":
    case "FALSE":
    case "False":
      return false;
    default:
      return null;
  }
}
function flagError(message) {
  process.stderr.write(`${message}
`);
  printUsage();
  process.exit(EXIT_USAGE);
}
var FLAG_DEFS = [
  { name: "url", type: "string", usage: "\u76EE\u6807 URL\uFF08\u5FC5\u586B\uFF09", def: null },
  { name: "query", type: "string", usage: "\u5185\u5BB9\u5F15\u5BFC", def: null },
  { name: "format", type: "string", usage: "markdown | text | html", def: "markdown" },
  { name: "max-chars", type: "int", usage: "\u6587\u672C\u4E0A\u9650\uFF1B0 \u4E0D\u9650", def: null },
  { name: "only-main", type: "", usage: "\u4EC5\u4E3B\u4F53\u5185\u5BB9", def: "true" },
  { name: "no-cache", type: "", usage: "\u5F3A\u5236\u4E0D\u4F7F\u7528\u7F13\u5B58", def: null },
  { name: "timeout", type: "int", usage: "\u8D85\u65F6\u6BEB\u79D2", def: "30000" },
  { name: "with-links", type: "", usage: "\u9644\u5E26\u63D0\u53D6\u7684\u94FE\u63A5", def: null },
  { name: "extract-depth", type: "string", usage: "tavily: basic | advanced", def: null },
  { name: "provider", type: "string", usage: "\u6307\u5B9A\u670D\u52A1\u5546\uFF1B\u7A7A\u5219\u81EA\u52A8\u56DE\u9000", def: null },
  { name: "verbose", type: "", usage: "\u8F93\u51FA\u8C03\u8BD5\u4FE1\u606F\u5230 stderr", def: null }
];
function printUsage() {
  const program = process.argv[1] ?? "pullpage";
  let out = `Usage of ${program}:
`;
  for (const def of [...FLAG_DEFS].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    let line = `  -${def.name}`;
    if (def.type !== "") {
      line += ` ${def.type}`;
    }
    line += `
    	${def.usage}`;
    if (def.def !== null) {
      line += def.type === "string" ? ` (default "${def.def}")` : ` (default ${def.def})`;
    }
    out += `${line}
`;
  }
  process.stderr.write(out);
}
await main();
export {
  buildAdapter
};
