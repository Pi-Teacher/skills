# 配置与环境变量

所有配置项统一使用 `PLATYPUS_` 前缀, 通过系统环境变量或 `.env` 文件提供。本文列出每个变量的作用、是否必需、默认值与常见陷阱。变量名与默认值的权威来源是 `PLATYPUS_AI_FORMAT` 等键的读取逻辑, 可在随包发布的 `src/config.ts` 与 `src/providers/*.ts` 中核对。

## 配置从哪来

CLI 只从两个位置取配置, 顺序固定:

1. `--env <文件路径>` 指定的文件, 必须写在 `search` 或 `list` 之前;
2. 系统环境变量。

程序**不会**自动查找当前目录或可执行文件附近的 `.env`。这意味着如果 skill 目录里放了 `.env`, 必须每次显式传入 `--env`, 否则该文件完全不参与配置:

```bash
platypus --env /root/.pi/agent/skills/platypus/.env list
```

取值优先级是文件优先, 缺失时才回退系统环境变量。判断"缺失"用的是 `??` 语义, 即只有变量**完全不存在**才回退; 文件里写了键但值为空 (`KEY=`) 会解析成空字符串, 依然是"存在", 于是**遮蔽**系统环境变量。实测: 文件写 `PLATYPUS_BRAVE_API_KEY=`、同时系统环境有 `PLATYPUS_BRAVE_API_KEY=sys-value` 时, `list` 输出 `[]`, 该 Provider 被视为未配置。想覆盖某个键而不遮蔽其他键时, 不要把不用的键写成空值, 直接删掉该行。

变量值按原始字符串使用, 不做 trim。仅 `list` 的配置判定会用 `trim()` 判空, 因此纯空格值的 Provider 不会出现在 `list` 里, 但也不会回退到系统环境变量。

## Provider 搜索变量

`list` 输出的可用 Provider 只取决于"该 Provider 的必需变量是否非空", 不检测上游连通性。搜索时缺必需变量会在发起请求前直接报 `缺少配置: <变量名>`。

| Provider | 必需变量 | 可选 BASE_URL 变量 | 默认地址 | 请求目标 |
| --- | --- | --- | --- | --- |
| `exa` | `PLATYPUS_EXA_API_KEY` | `PLATYPUS_EXA_BASE_URL` | `https://api.exa.ai` | `POST {base}/search` |
| `tavily` | `PLATYPUS_TAVILY_API_KEY` | `PLATYPUS_TAVILY_BASE_URL` | `https://api.tavily.com` | `POST {base}/search` |
| `jina` | `PLATYPUS_JINA_API_KEY` | `PLATYPUS_JINA_BASE_URL` | `https://s.jina.ai` | `GET {base}/search` |
| `brave` | `PLATYPUS_BRAVE_API_KEY` | `PLATYPUS_BRAVE_BASE_URL` | `https://api.search.brave.com` | `GET {base}/res/v1/web/search` |
| `ollama` | `PLATYPUS_OLLAMA_API_KEY` | `PLATYPUS_OLLAMA_BASE_URL` | `https://ollama.com` | `POST {base}/api/web_search` |
| `searxng` | `PLATYPUS_SEARXNG_BASE_URL` | 同必需项 | 无, 必须显式提供 | `GET {base}/search` |
| `gemini` | `PLATYPUS_GEMINI_API_KEY` | `PLATYPUS_GEMINI_BASE_URL` | SDK 默认端点 | 由 Google GenAI SDK 发出 |

BASE_URL 写服务根地址, 不要自己带上 `/search` 或厂商的具体路径: `exa`、`tavily`、`jina`、`searxng` 会追加 `/search`, `brave` 追加 `/res/v1/web/search`, `ollama` 追加 `/api/web_search`。尾部斜杠会被去掉, 所以 `https://api.exa.ai/` 与 `https://api.exa.ai` 等价。除 `searxng` 外的 BASE_URL 都是可选的, 用于指向自建代理或镜像。

`searxng` 没有默认实例, 必须通过 `PLATYPUS_SEARXNG_BASE_URL` 指向自托管实例, 且该实例需启用 JSON 输出格式。它不校验 API key, 所以本地实例无需凭据。

`brave`、`ollama` 的 BASE_URL 语义是"替换厂商根地址", 其余 Provider 的 BASE_URL 语义是"替换 API 根地址", 不要混用。

`gemini` 的搜索模型单独由 `PLATYPUS_GEMINI_MODEL` 控制, 未设置时回退到 `gemini-flash-lite-latest`; 命令行 `--model` 的优先级高于该变量。

## AI 清洗变量

只有在 `--ai` 模式下才会读取下列变量。不加 `--ai` 时它们完全不起作用, 也无需配置; 此时 stdout 输出上游原始 JSON。

| 变量 | 必需 | 作用与默认值 |
| --- | --- | --- |
| `PLATYPUS_AI_FORMAT` | 是 | 取值必须是 `openai`、`anthropic` 或 `gemini`, 其他值报 `PLATYPUS_AI_FORMAT 必须为 openai、anthropic 或 gemini` |
| `PLATYPUS_AI_API_KEY` | 是 | AI 服务的密钥 |
| `PLATYPUS_AI_MODEL` | 是 | AI 清洗模型名, 无默认值 |
| `PLATYPUS_AI_BASE_URL` | 否 | 三家语义不同, 见下方说明 |
| `PLATYPUS_AI_TIMEOUT` | 否 | 单次 AI 清洗调用 (含 SDK 重试) 的超时秒数, 默认 `120`; 必须是正整数, 否则报错 |
| `PLATYPUS_AI_STREAMBLE` | 否 | 仅当值为字符串 `true` 时生效, 且只对 `openai`、`anthropic` 启用 SDK 流式聚合; `gemini` 始终非流式 |
| `PLATYPUS_AI_MAX_TOKENS` | 否 | 仅 `anthropic` 使用, 输出 token 上限, 默认 `8192`, 必须是正整数 |

`PLATYPUS_AI_TIMEOUT` 与 `--ai-timeout` 作用相同, 命令行优先; 二者都只覆盖 AI 清洗耗时, 不含上游搜索耗时。`--provider-timeout` 是另一套机制, 它**只支持命令行**, 不读取 `.env` 或系统环境变量, 默认 30 秒。

`PLATYPUS_AI_BASE_URL` 的三种解释:

- `openai`: 末段路径被替换为 `/v1`, 之后由 SDK 追加 `/chat/completions`。例如 `https://host/v1/chat/completions` 会变成 `https://host/v1`。
- `anthropic`: 原样交给 Anthropic SDK, 不做路径改写。
- `gemini`: 作为 Google GenAI SDK 的 `httpOptions.baseUrl`。

`PLATYPUS_AI_FORMAT=gemini` 时使用的是 `PLATYPUS_AI_*` 这套变量, 与搜索用的 `PLATYPUS_GEMINI_*` 相互独立, 不要指望搜索的 Gemini 配置能顺带用于 AI 清洗。
