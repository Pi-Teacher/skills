import {Adapter, FetchRequest, FetchResponse} from "./adapter.js";
import {envOr, loadEnv, requireKey} from "./env.js";
import {ExaAdapter} from "./adapter_exa.js";
import {TavilyAdapter} from "./adapter_tavily.js";
import {JinaAdapter} from "./adapter_jina.js";
import {FirecrawlAdapter} from "./adapter_firecrawl.js";

/**
 * 用法：pullpage --url URL [--query q] [--format markdown|text|html] [--max-chars N]
 *                [--only-main] [--no-cache] [--timeout ms] [--with-links]
 *                [--extract-depth basic|advanced]
 *                [--provider jina|tavily|exa|firecrawl|all]
 *                [--verbose]
 *
 * --provider 行为：
 *   - 空（默认）：按 tavily → exa → firecrawl → jina 顺序回退，首个成功即返回
 *   - 指定单家：仅尝试该家
 *   - all：并发抓取所有已配置 key 的服务商，按 "=== provider ===" 分段拼接返回
 */

/** 各家官方 API 默认地址。 */
const DEFAULT_BASE_URLS: Record<string, string> = {
  exa: "https://api.exa.ai",
  tavily: "https://api.tavily.com",
  jina: "https://r.jina.ai",
  firecrawl: "https://api.firecrawl.dev",
};

/** 默认回退顺序：jina 能力最强留最后兜底。 */
const DEFAULT_ORDER = ["tavily", "exa", "firecrawl", "jina"];

const EXIT_OK = 0;
const EXIT_FAILURE = 1;
const EXIT_USAGE = 2;

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));

  if (flags.url === "") {
    process.stderr.write("错误：缺少 --url\n");
    printUsage();
    process.exitCode = EXIT_USAGE;
    return;
  }

  const req: FetchRequest = {
    url: flags.url,
    query: flags.query,
    format: flags.format,
    maxCharacters: flags.maxChars,
    onlyMainContent: flags.onlyMain,
    cacheTolerance: flags.noCache ? "no-cache" : "auto",
    timeoutMs: flags.timeout,
    includeLinks: flags.withLinks,
    extractDepth: flags.extractDepth,
    provider: flags.provider,
  };

  let env = new Map<string, string>();
  try {
    env = loadEnv();
  } catch (error) {
    if (flags.verbose) {
      process.stderr.write(`警告：${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  // 全局超时给单适配器超时的两倍余量：回退链上多家串行时，每家都能用满自己的超时。
  // 非正的 timeout 在原 Go 实现里等价于已过期的 context（请求立即失败），这里显式退化为已中止信号，
  // 因为 AbortSignal.timeout() 不接受负数。
  const globalSignal =
    req.timeoutMs > 0 ? AbortSignal.timeout(req.timeoutMs * 2) : AbortSignal.abort();

  // 分派执行模式
  if (req.provider.toLowerCase() === "all") {
    await runAll(req, env, flags.verbose, flags.withLinks, globalSignal);
    return;
  }

  // 候选适配器顺序：默认 tavily → exa → firecrawl → jina；指定 --provider 则仅该家
  const order = req.provider !== "" ? [req.provider] : DEFAULT_ORDER;
  const errors: string[] = [];
  for (const name of order) {
    const out = await tryFetch(name, env, req, flags.verbose, globalSignal);
    if (out instanceof Error) {
      errors.push(out.message);
      continue;
    }
    emitSuccess(out, flags.withLinks);
    return;
  }

  process.stderr.write("所有 fetch 提供商均失败：\n");
  for (const message of errors) {
    process.stderr.write(`  - ${message}\n`);
  }
  process.exitCode = EXIT_FAILURE;
}

/** 构造适配器并抓取；verbose 控制 stderr 调试输出。失败返回 Error 而不抛出，交由调用方汇总。 */
async function tryFetch(
  name: string,
  env: Map<string, string>,
  req: FetchRequest,
  verbose: boolean,
  signal: AbortSignal,
): Promise<FetchResponse | Error> {
  let adapter: Adapter;
  try {
    adapter = buildAdapter(name, env);
  } catch (error) {
    return new Error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (verbose) {
    process.stderr.write(`尝试： ${name}\n`);
  }
  try {
    const out = await adapter.fetch(req, signal);
    if (verbose) {
      process.stderr.write(`成功： ${out.provider} cost: ${out.cost ?? ""}\n`);
    }
    return out;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (verbose) {
      process.stderr.write(`失败： ${message}\n`);
    }
    return new Error(`${name}: ${message}`);
  }
}

/** 输出单家成功结果到 stdout。 */
function emitSuccess(out: FetchResponse, withLinks: boolean): void {
  if (out.links.length > 0 && withLinks) {
    process.stdout.write(`<!-- provider: ${out.provider} -->\n`);
    for (const link of out.links) {
      process.stdout.write(`-  ${link}\n`);
    }
    process.stdout.write("---\n");
  }
  process.stdout.write(out.content);
}

/**
 * 并发抓取所有已配置 key 的服务商，按 "=== provider === 内容" 格式拼接输出。
 * 任一家成功即计入；全部失败则以退出码 1 结束。
 */
async function runAll(
  req: FetchRequest,
  env: Map<string, string>,
  verbose: boolean,
  withLinks: boolean,
  signal: AbortSignal,
): Promise<void> {
  type Result = {name: string; content: string; links: string[]; error: string};

  // 并发发起，再按固定顺序取用，保证输出顺序稳定且不受响应快慢影响
  const settled = await Promise.all(
    DEFAULT_ORDER.map(async (name): Promise<Result> => {
      const out = await tryFetch(name, env, req, verbose, signal);
      if (out instanceof Error) {
        return {name, content: "", links: [], error: out.message};
      }
      return {name, content: out.content, links: out.links, error: ""};
    }),
  );

  const byName = new Map(settled.map((r) => [r.name, r]));
  const errors = settled.filter((r) => r.error !== "").map((r) => r.error);
  if (settled.every((r) => r.error !== "")) {
    process.stderr.write("所有 fetch 提供商均失败：\n");
    for (const message of errors) {
      process.stderr.write(`  - ${message}\n`);
    }
    process.exitCode = EXIT_FAILURE;
    return;
  }

  let output = "";
  for (const name of DEFAULT_ORDER) {
    const r = byName.get(name)!;
    if (r.error !== "") {
      continue;
    }
    output += `=== ${name} ===\n`;
    if (withLinks && r.links.length > 0) {
      for (const link of r.links) {
        output += `- ${link}\n`;
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

/**
 * 按名称构造适配器；对应 key 缺失则抛出错误。
 * baseURL 从 env 的 *_BASEURL 读取，为空用官方默认地址，便于用户用反代绕过网络不通。
 */
export function buildAdapter(name: string, env: Map<string, string>): Adapter {
  const lower = name.toLowerCase();
  switch (lower) {
    case "exa":
      return new ExaAdapter(requireKey(env, "EXA_API_KEY"), envOr(env, "EXA_BASEURL", DEFAULT_BASE_URLS.exa!));
    case "tavily":
      return new TavilyAdapter(
        requireKey(env, "TAVILY_API_KEY"),
        envOr(env, "TAVILY_BASEURL", DEFAULT_BASE_URLS.tavily!),
      );
    case "jina":
      return new JinaAdapter(requireKey(env, "JINA_API_KEY"), envOr(env, "JINA_BASEURL", DEFAULT_BASE_URLS.jina!));
    case "firecrawl":
      return new FirecrawlAdapter(
        requireKey(env, "FIRECRAWL_API_KEY"),
        envOr(env, "FIRECRAWL_BASEURL", DEFAULT_BASE_URLS.firecrawl!),
      );
    default:
      throw new Error(`未知服务商：${name}`);
  }
}

interface CliFlags {
  url: string;
  query: string;
  format: string;
  maxChars: number;
  onlyMain: boolean;
  noCache: boolean;
  timeout: number;
  withLinks: boolean;
  extractDepth: string;
  provider: string;
  verbose: boolean;
}

/**
 * 复刻 Go 标准库 flag 的解析语义，使参数行为与原实现一致：
 * 单/双横线等价、支持 --k=v 与 --k v、布尔值必须用 = 形式、`--` 终止解析、
 * 遇到首个非 flag 参数即停止，错误信息与 usage 输出对齐 Go 的格式。
 */
function parseFlags(argv: string[]): CliFlags {
  const flags: CliFlags = {
    url: "",
    query: "",
    format: "markdown",
    maxChars: 0,
    onlyMain: true, // Go 版 --only-main 默认 true
    noCache: false,
    timeout: 30000,
    withLinks: false,
    extractDepth: "",
    provider: "",
    verbose: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    // 首个非 flag 参数之后的全部内容都不再解析（与原 Go 实现同理，程序本身也不使用它们）
    if (arg === "--" || arg === "-" || !arg.startsWith("-")) {
      break;
    }

    let name = arg.replace(/^-+/, "");
    let value: string | undefined;
    const eq = name.indexOf("=");
    if (eq >= 0) {
      value = name.slice(eq + 1);
      name = name.slice(0, eq);
    }
    if (name === "" || name.startsWith("-")) {
      // 形如 "---x" 的参数在 Go 中视为未知 flag
      flagError(`flag provided but not defined: -${name}`);
    }

    switch (name) {
      case "url":
      case "query":
      case "format":
      case "extract-depth":
      case "provider": {
        if (value === undefined) {
          if (i + 1 >= argv.length) {
            flagError(`flag needs an argument: -${name}`);
          }
          value = argv[++i]!;
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
        if (value === undefined) {
          if (i + 1 >= argv.length) {
            flagError(`flag needs an argument: -${name}`);
          }
          value = argv[++i]!;
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
        // Go 的布尔 flag 只在 = 形式下取值，写 `-verbose false` 时 false 会被当作位置参数
        let boolValue = true;
        if (value !== undefined) {
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

/** Go flag 的 int 解析：支持十进制与 0x/0o/0b 前缀。非法值返回 null。 */
function parseGoInt(text: string): number | null {
  if (!/^[-+]?(0[xX][0-9a-fA-F]+|0[oO][0-7]+|0[bB][01]+|\d+)$/.test(text)) {
    return null;
  }
  const negative = text.startsWith("-");
  const digits = text.replace(/^[-+]/, "");
  let value: number;
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

/** Go flag 的 bool 解析：接受 strconv.ParseBool 全部合法取值，其余返回 null。 */
function parseGoBool(text: string): boolean | null {
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

/** flag 解析错误：与 Go 一致地打印错误与 usage 后以退出码 2 结束。 */
function flagError(message: string): never {
  process.stderr.write(`${message}\n`);
  printUsage();
  process.exit(EXIT_USAGE);
}

/** flag 定义表，顺序无关紧要（打印时按名称排序以对齐 Go 的 PrintDefaults）。 */
const FLAG_DEFS: Array<{name: string; type: string; usage: string; def: string | null}> = [
  {name: "url", type: "string", usage: "目标 URL（必填）", def: null},
  {name: "query", type: "string", usage: "内容引导", def: null},
  {name: "format", type: "string", usage: "markdown | text | html", def: "markdown"},
  {name: "max-chars", type: "int", usage: "文本上限；0 不限", def: null},
  {name: "only-main", type: "", usage: "仅主体内容", def: "true"},
  {name: "no-cache", type: "", usage: "强制不使用缓存", def: null},
  {name: "timeout", type: "int", usage: "超时毫秒", def: "30000"},
  {name: "with-links", type: "", usage: "附带提取的链接", def: null},
  {name: "extract-depth", type: "string", usage: "tavily: basic | advanced", def: null},
  {name: "provider", type: "string", usage: "指定服务商；空则自动回退", def: null},
  {name: "verbose", type: "", usage: "输出调试信息到 stderr", def: null},
];

/** 打印 usage，格式对齐 Go flag 包的 PrintDefaults（两空格缩进 + 四空格加制表符换行）。 */
function printUsage(): void {
  const program = process.argv[1] ?? "pullpage";
  let out = `Usage of ${program}:\n`;
  for (const def of [...FLAG_DEFS].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    let line = `  -${def.name}`;
    if (def.type !== "") {
      line += ` ${def.type}`;
    }
    line += `\n    \t${def.usage}`;
    if (def.def !== null) {
      line += def.type === "string" ? ` (default "${def.def}")` : ` (default ${def.def})`;
    }
    out += `${line}\n`;
  }
  process.stderr.write(out);
}

await main();
