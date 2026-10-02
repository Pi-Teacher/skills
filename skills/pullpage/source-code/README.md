# pullpage 源码

pullpage skill 的 CLI 工具源码，TypeScript 编写，打包为单个 ESM 文件 `../scripts/pullpage.js`。

运行时只依赖 Node 22+ 内置能力（全局 `fetch`、`AbortSignal.any`、`import.meta.dirname`），不引入任何第三方运行时依赖；esbuild 与 typescript 仅作为 devDependency 用于构建与类型检查。之所以从 Go 重写为 TS，是因为 agent 运行环境普遍自带 Node 而不一定有 Go 工具链。

## 构建

```bash
npm install          # 安装 devDependencies
npm run typecheck    # 类型检查
npm run build        # 打包到 ../scripts/pullpage.js
```

`node_modules` 仅构建时需要，产物可直接拷贝使用。

## 设计要点

### 适配器接口（Adapter）

各家 fetch 提供商协议差异大，统一抽象为：

```ts
interface Adapter {
  readonly name: string;                                          // "exa" | "tavily" | "jina" | "firecrawl"
  fetch(req: FetchRequest, signal: AbortSignal): Promise<FetchResponse>;
}
```

`signal` 是调度层的全局超时信号，适配器内部再与自身超时合并（`AbortSignal.any`），保证父级超时后请求不悬挂。

### 统一请求模型 FetchRequest

抽象常用且各家都支持的参数：

| 字段 | 类型 | 说明 |
|:-|:-|:-|
| `url` | string | 目标 URL（每次只抓取一个） |
| `query` | string | 内容引导（exa highlights.query / tavily query） |
| `format` | string | `markdown`（默认）/`text`/`html` |
| `maxCharacters` | number | 文本上限（exa text.maxCharacters；jina/firecrawl 不支持时后处理裁剪） |
| `onlyMainContent` | boolean | 仅主体内容（firecrawl onlyMainContent 默认 true；jina 默认行为；exa 由 verbosity=compact 近似） |
| `cacheTolerance` | string | `auto`/`no-cache`（映射各家的 maxAge/noCache） |
| `timeoutMs` | number | 超时（映射 timeout/livecrawlTimeout），全局超时取其两倍 |
| `includeLinks` | boolean | 是否附带提取的链接列表 |
| `extractDepth` | string | tavily 专有 `basic`/`advanced`，其他平台忽略 |
| `provider` | string | 指定单家 `jina`/`tavily`/`exa`/`firecrawl`；空则按默认顺序回退 |

### 统一响应模型 FetchResponse

| 字段 | 说明 |
|:-|:-|
| `content` | 正文（单 URL） |
| `links` | 可选链接列表 |
| `raw` | 原始响应体，便于排查 |
| `provider` | 完成的服务商名 |
| `cost` | 字符串形式的美元成本（若平台返回） |

### 回退调度

1. 优先使用已有的 fetch 工具（本 CLI 不负责，由 MCP/skill 层在调用前判断）
2. 失败时按默认顺序尝试：tavily → exa → firecrawl → jina（jina 能力最强留最后兜底）
3. 任一成功即返回；全部失败则汇总错误并退出码 1
4. `--provider` 指定单家时仅尝试该家；`--provider all` 并发抓取所有已配置 key 的服务商，按 tavily → exa → firecrawl → jina 顺序以 `=== provider ===` 分段拼接输出

### 参数解析

`parseFlags` 复刻 Go 标准库 `flag` 的语义，使参数行为与原实现一致：单/双横线等价（`-url` 与 `--url`）、支持 `--k=v` 与 `--k v`、布尔值必须用 `=` 形式（`--only-main=false`；写成 `--only-main false` 时 `false` 会被当作位置参数而停止解析）、`--` 终止解析、遇到首个非 flag 参数即停止。错误信息与 usage 输出对齐 Go 的格式，退出码 2。

### API Key 与反代地址

从 skill 根目录的 `.env` 读取（CLI 自动定位，`PULLPAGE_SKILL_DIR` 优先，其次为产物所在 `scripts` 目录的父目录）：

```
EXA_API_KEY=...
TAVILY_API_KEY=...
JINA_API_KEY=...
FIRECRAWL_API_KEY=...

# 可选反代地址，留空用官方默认
EXA_BASEURL=https://api.exa.ai
TAVILY_BASEURL=https://api.tavily.com
JINA_BASEURL=https://r.jina.ai
FIRECRAWL_BASEURL=https://api.firecrawl.dev
```

网络不通时，用户可在通畅的服务器架设反代，填入对应 `*_BASEURL` 绕过。

### 与 Go 版的差异

`--max-chars` 改为按 Unicode 码点截断。Go 版按字节切片，中文等多字节字符可能被切坏产生乱码；码点截断表意相同且不产生非法字符，极端情况下截断位置与 Go 版相差几个字节。

## 目录

```
source-code/
├── package.json
├── tsconfig.json
├── build.mjs            # esbuild 打包脚本，输出 ../scripts/pullpage.js
├── main.ts              # CLI 入口、参数解析、回退调度
├── adapter.ts           # Adapter 接口、统一请求/响应模型、公共工具
├── env.ts               # .env 解析
├── adapter_exa.ts
├── adapter_tavily.ts
├── adapter_jina.ts
└── adapter_firecrawl.ts
```

原 Go 实现保留在 `../sourcecode-old-go-backup/` 作为参考。
