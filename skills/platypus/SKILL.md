---
name: platypus
description: 使用 Platypus从多个渠道进行联网搜索，当用户要求查找最新资料、网页搜索、检索来源时使用，查询代码库，第三方库/框架时优先使用context7。

---
# 程序说明

platypus 将多个网络搜索服务封装，并提供AI清洗结果功能。
下文中的 `{skill_path}` 指的是本skill的`SKILL.md` 所在位置。

##  检查是否已经安装

执行  `platypus --help` 若命令不存在，按照 `{skill_path}/references/install.md` 安装

## platypus 配置

在platypus 使用前，需进行提供商密钥与baseurl的配置, 如果当前已有配置，不要重复配置，是否已有配置取决于`platypus --env {skill_path}/.env list` 是否为空，如果为空，读取 `{skill_path}/references/config.md`  指导用户配置。

## platypus 支持的搜索提供商与各自特点

以下名称直接用于 `platypus search <provider> --query "关键词"`，是程序支持的提供商； 运行 `platypus [--env <文件>] list` 可列出当前已配置的提供商，不检测连通性，是以下提供商中当前可用的提供商，在使用前应确保运行 `platypus [--env <文件>] list` 明确当前可用提供商，只使用当前可用提供商。

- `exa`：官方文档和论文权重高，适合查使用文档、版本信息与研究资料，以及核验其他搜索结果。支持发布日期或抓取日期筛选，不支持搜索语言筛选参数。
- `tavily`：结构化结果内容较完整，适合新闻、一般事实与初步资料收集。支持时间范围或日期筛选，不支持搜索语言筛选参数。
- `brave`：通用网页搜索，搜索速度快，支持时间筛选与语言筛选。
- `jina`：当前 CLI 仅接入搜索端点。支持 语言筛选，不支持时间筛选参数。
- `ollama`：通用网页搜索，搜索速度快不支持时间筛选与语言筛选。
- `searxng`：使用自托管实例搜索。支持时间筛选与语言筛选，实际效果取决于实例及引擎。
- `gemini`： 通过Gemini模型联网搜索并综合回答，适合快速回答简单问题，不返回网页搜索结果列表，不支持时间筛选与语言筛选。



## platypus 用法

```bash
platypus [--env <文件>] [--ai] [--prompt <要求>] [--ai-timeout <秒>] [--provider-timeout <秒>] search <provider> --query "关键词" [提供商参数]
```
- `--env <文件>`：必须传递， 优先使用skill所在目录的 `.env`文件

`--ai` 选项必须放在 `search` 前；`<provider>` 后的参数由该提供商处理。

- `--env <文件>`：必须传递，优先传递如果本 skill所在目录的 `.env`即 `{skill_path}/.env`，缺少时回退系统环境变量。CLI 不会自动寻找 `.env`。，必须显式传递。
- `--ai`：将上游原始响应交给 AI 清洗，成功后输出纯文本；不启用时输出上游原始 JSON。需要配置 `PLATYPUS_AI_FORMAT`、`PLATYPUS_AI_API_KEY`、`PLATYPUS_AI_MODEL`。如果已配置，推荐使用，启用后可以减少大量噪音与无关信息。 
- `--prompt <要求>`：仅与 `--ai` 同用，替换默认清洗要求；AI 同时接收搜索词与原始响应。
- `--ai-timeout <秒>`：仅与 `--ai` 同用，单次 AI 清洗调用 (含 SDK 重试) 的超时，默认 120 秒；优先级为 CLI 参数 > `--env` 文件中的 `PLATYPUS_AI_TIMEOUT` > 系统环境变量。不包含上游搜索耗时。
- `--provider-timeout <秒>`：单次上游 Provider API 调用 (含响应正文读取) 的超时，默认 30 秒；只通过 CLI 指定，不读取 `.env` 或系统环境变量，超时后取消调用，不重试。与 AI 清洗分别计时。

- `--query "关键词"`：搜索词；其余参数使用选定提供商的字段名，不假定跨平台通用。

### 按搜索需求选择提供商与搜索原则

#### 执行搜索时的基本原则

1. **先理解，再检索**：提取用户需求的主题、知识类型时间要求、期望结果类型。
2. **来源优先级**：官方文档/发布说明 > 学术/标准/机构资料 > 主流可靠媒体/专家博文 > 社区论坛/社交媒体。
3. **诚实表达不确定性**：证据不足、来源冲突或时间不确定时明确说明。

####  按搜索需求选择提供商

- 精准权威：优先选择适合检索官方文档和权威资料的提供商；该家支持域名筛选时限制官方网站，并核对原始来源。

- 广度优先：按需使用多家已配置提供商，比较结果并交叉验证；

- 新鲜度优先：结合主题并优先选择支持时间筛选的提供商；使用该家原生时间参数，并核对结果的发布时间。

### 各提供商的用法

选定提供商后，先读 `references/provider/{provider}/common.md`；例如选 `exa`，读 `references/provider/exa/common.md`。常用参数不足或需要核对上游 API 时，再读同目录的 `advanced.md`，例如 `references/provider/exa/advanced.md`。

阅读上游官方文档后，仍通过 `platypus search <provider>` 调用对应 adapter，不另写 `curl` 或 Node.js 请求脚本。将文档中该搜索端点的请求字段写成该 Provider 的 `--字段名 值`；数组和对象参数传 JSON 字符串，例如 `--includeDomains '["example.com"]'`。只有搜索词统一写为 `--query`；先核对 adapter 实际支持的参数，不要把其他端点的字段直接套进来。

### 页面抓取约束

当上游提供商返回标题与URL而非正文时，如果需要获取URL内容，应该调用`pullpage` skill抓取页面，不要抓取大量低价值页面。优先抓官方、权威、原始来源。

### 异常排查

AI 清洗搜索结果失败： 将在 stdout 给出 `/tmp/platypus-error-*.json` 路径，读取其中AI调用失败原因，根据`references/ai-troubleshooting.md`排查。

提供商返回失败： 根据 stderr 和退出码排查，若stderr未说明详细原因，可按照 `references/provider/{返回失败的提供商名称}/advanced.md` 获取官方文档进行排查。
