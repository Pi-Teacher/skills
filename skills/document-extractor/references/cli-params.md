# mineru-open-api CLI 完整参数参考

> 来源：官方仓库 `cli/mineru-open-api/README.md`（Apache-2.0）。本 skill 不含 `crawl`（网页提取另用专用工具）。

## 安装

| 方式 | 命令 |
|---|---|
| npm | `npm install -g mineru-open-api`（升级加 `@latest`） |
| Go | `go install github.com/opendatalab/MinerU-Ecosystem/cli/mineru-open-api@latest` |
| 官方脚本 (Linux/macOS) | `curl -fsSL https://cdn-mineru.openxlab.org.cn/open-api-cli/install.sh \| sh` |
| Windows | `irm https://cdn-mineru.openxlab.org.cn/open-api-cli/install.ps1 \| iex` |

验证：`mineru-open-api version`。自助升级：`mineru-open-api update` / `update --check`。

## 全局配置

### Token 解析顺序
1. `--token`
2. `MINERU_TOKEN`
3. `~/.mineru/config.yaml`（`mineru-open-api auth` 写入）

### Source 解析顺序（请求追踪标识）
1. `MINERU_SOURCE`
2. `~/.mineru/config.yaml` 的 `source`
3. 默认：`open-api-cli`

持久化：`mineru-open-api set-source <value>` / `--show` / `--reset`

### 全局 flag

| Flag | 默认 | 说明 |
|---|---|---|
| `--token` | 未设 | 覆盖 env/config 的 token（仅当前命令） |
| `--base-url` | 公共 API | 私有化部署时覆盖 API 地址 |
| `-v, --verbose` | false | 打印 HTTP 请求/响应调试日志 |

## 命令总览

| 命令 | 鉴权 | 用途 |
|---|---|---|
| `flash-extract` | 免 | 快速文档提取，Markdown 输出 |
| `extract` | 需 | 精度文档提取 |
| `auth` | 可选 | 保存/查看/校验 token |
| `status` | 需 | 按 task ID 查询任务状态 |
| `set-source` | 免 | 持久化请求 source 头 |
| `update` | 免 | 检查/安装最新版 |
| `version` | 免 | 打印构建与版本信息 |

## flash-extract vs extract

| | `flash-extract` | `extract` |
|---|---|---|
| 鉴权 | 免 token | 需 token |
| 格式 | PDF、图片(png/jpg/webp等)、Docx、PPTx、Excel(xls/xlsx) | PDF、图片、Doc、Docx、Ppt、Pptx、Html |
| 文件大小 | ≤10 MB | ≤200 MB |
| 页数 | ≤20 页 | ≤200 页 |
| 输出 | 仅 Markdown（公式/表格默认开，OCR 默认关） | md/html/latex/docx/json |
| 批量 | 一次一个 | 多个文件与 URL |

## 输入/输出行为

- `extract` 接受本地文件与 URL；`flash-extract` 一次一个本地文件或 URL。
- 输入还可来自 `--list <file>`（每行一个）、`--stdin`（文件字节）、`--stdin-list`。
- **输出流向**：不加 `-o` 时解析结果 → stdout，进度/状态/错误 → stderr。此分隔保证管道安全：
  `mineru-open-api extract report.pdf | some-llm-tool`
- **不加 `-o` 时 stdout 规则**：只允许 1 个输入、1 种格式；二进制格式（docx）不能写 stdout。
- **批量模式必须 `-o` 存目录**。

## flash-extract 参数

| Flag | 默认 | 说明 |
|---|---|---|
| `-o, --output` | stdin | 输出文件或目录；省略 → stdout |
| `--language` | `ch` | 仅当改动时才发送 |
| `--pages` | 未设 | 页码范围如 `1-10` |
| `--ocr` | 关 | 扫描件 OCR，`--ocr` 打开 |
| `--formula` | 开 | `--formula=false` 关闭公式识别 |
| `--table` | 开 | `--table=false` 关闭表格识别 |
| `--timeout` | `300`s | 轮询总等待秒 |

```bash
mineru-open-api flash-extract report.pdf                    # md → stdout
mineru-open-api flash-extract https://.../example.pdf       # URL 输入
mineru-open-api flash-extract report.pdf -o ./out/          # 落盘
mineru-open-api flash-extract report.pdf --language en --pages 1-5
```

## extract 参数

### 默认值

| Flag | 默认 | 说明 |
|---|---|---|
| `-f, --format` | `md` | 逗号分隔格式 |
| `--model` | auto | HTML 用 `html`，其余文档默认 `vlm` |
| `--ocr` | false | 扫描件 OCR 开关 |
| `--formula` | true | 公式识别开关 |
| `--table` | true | 表格识别开关 |
| `-l, --language` | `ch` | 仅当改动时才发送 |
| `--pages` | 未设 | 全部页面 |
| `--timeout` | `300` 单 / `1800` 批 | 轮询等待秒 |
| `--stdin` | false | 从 stdin 读文件字节 |
| `--stdin-name` | `stdin.pdf` | 配合 `--stdin` 的虚拟文件名 |
| `--list` | 未设 | 从文件读输入 |
| `--stdin-list` | false | 从 stdin 读输入列表 |
| `--concurrency` | 0 | **预留位，当前 CLI 未实际生效** |

### 格式矩阵

| 格式 | stdout | 配 `-o` 存盘 |
|---|---|---|
| `md` | ✅ | ✅ |
| `json` | ✅ | ❌ |
| `html` | ✅ | ✅ |
| `latex` | ✅ | ✅ |
| `docx` | ❌ | ✅ |

### flag 一览

| Flag | 说明 |
|---|---|
| `-o, --output` | 输出文件或目录；省略 → stdout |
| `-f, --format` | `md,json,html,latex,docx` |
| `--model` | `vlm` / `pipeline` / `html` |
| `--ocr` | 扫描件 OCR |
| `--formula=false` | 关公式识别 |
| `--table=false` | 关表格识别 |
| `-l, --language` | 文档语言 |
| `--pages` | 页码范围如 `1-10,15` |
| `--timeout` | 轮询超时秒 |
| `--list` | 从文件读输入 |
| `--stdin-list` | 从 stdin 读输入列表 |
| `--stdin` | 从 stdin 读原始文件字节 |
| `--stdin-name` | 配 `--stdin` 用的文件名 |
| `--concurrency` | 预留批量并发 flag |

### 示例

```bash
mineru-open-api auth                                        # 一次性认证
mineru-open-api extract report.pdf                          # md → stdout
mineru-open-api extract report.pdf -f html                  # html → stdout
mineru-open-api extract report.pdf -f md,docx -o ./results/ # 多格式落地
mineru-open-api extract https://example.com/file.pdf        # URL
mineru-open-api extract --list files.txt -o ./results/      # 列表批量
cat report.pdf | mineru-open-api extract --stdin --stdin-name report.pdf
```

## auth 命令

```bash
mineru-open-api auth              # 交互式设置 token
mineru-open-api auth --show       # 显示掩码 token 与来源
mineru-open-api auth --verify     # 本地校验 token 格式
```

## 其他命令

```bash
mineru-open-api status <task-id>            # 按 task ID 查询
mineru-open-api status <task-id> --wait -o ./out/
mineru-open-api set-source my-agent         # 持久化 source 头（--show / --reset）
mineru-open-api version
```

## 典型场景

```bash
export MINERU_TOKEN="your_token_here"
mineru-open-api extract paper.pdf | some-llm-tool    # 管道喂下游
mineru-open-api extract *.pdf -o ./results/          # 批量全存目录
mineru-open-api flash-extract quick-preview.pdf      # 免 token 快速预览
curl -L https://example.com/report.pdf | mineru-open-api extract --stdin --stdin-name report.pdf
```

> 官方文档：https://github.com/opendatalab/MinerU-Ecosystem/tree/main/cli/mineru-open-api
> API 文档：https://mineru.net/apiManage/docs