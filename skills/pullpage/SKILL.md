---
name: pullpage
description: 当需要从单个 URL 抓取内容时使用（markdown 优先）。优先使用此skill完成url抓取而不是使用mcp或fetch、webfetch工具。
disable-model-invocation: false
---

# pullpage
pullpage cli是一个聚合了多个在线平台的抓取功能的工具，按照tavily → exa → firecrawl → jina 顺序自动回退，回退规则为：HTTP 层失败、服务商明确失败、内容为空」才回退，抓取返回的结果是否有意义，需要你自行判断。例如HTTP 200 但抓到 WAF 页/错误页」不会自动回退。
## 基础用法

调用 CLI（下文所有相对路径均相对于本 SKILL.md 所在目录解析，独立于安装位置）：

```bash
node scripts/pullpage.js --url <URL>
```

省略 `--provider` 时按默认顺序回退，首个成功即返回，正文打印到 stdout；全部失败以非零退出码结束，错误汇总到 stderr。

### 指定单家服务商

```bash
node scripts/pullpage.js --url <URL> --provider jina
```

可选值：`tavily` / `exa` / `firecrawl` / `jina`。仅尝试该家，失败即结束。

### 常用选项

| 选项 | 说明 |
|:-|:-|
| `--url URL` | 目标 URL（必填） |
| `--provider NAME` | 指定单家；省略则自动回退 |
| `--format markdown\|text\|html` | 输出格式，默认 markdown |
| `--max-chars N` | 正文字符上限 |

其余选项（`--query`、`--with-links`、`--only-main`、`--no-cache`、`--timeout`、`--extract-depth`、`--verbose`）属进阶用法，见下方"进阶"。

## 进阶

`--query` 传入内容引导，让服务商优先回传与该意图相关的片段，适合目标页面很长而只需要其中一部分的场景；目前仅 tavily 与 exa 支持，其余两家会忽略。

`--with-links` 附带提取到的链接列表，以 `<!-- provider: xxx -->` 注释开头、`---` 结尾，然后才是正文，便于区分链接与内容。

`--no-cache` 强制绕过服务商缓存重新抓取，用于确认页面当前内容；不加时服务商可能返回缓存副本，更快但可能是旧内容。

`--only-main` 仅保留主体内容，默认开启，关闭写 `--only-main=false`。`--extract-depth` 传给 tavily 控制提取深度，`basic` 更快、`advanced` 更完整但更慢也更贵。`--timeout` 为毫秒，同时决定单家超时与全局超时。`--verbose` 把尝试与结果写入 stderr，不影响 stdout 的正文，排查回退到哪一家时用。

这几个选项在各家服务商的生效情况并不一致：有的被直接忽略，有的只是近似实现，有的需要客户端后处理。具体矩阵、超时与退出码的完整语义见 [doc/cli-options.md](doc/cli-options.md)。


