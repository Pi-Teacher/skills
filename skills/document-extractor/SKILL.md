---
name: document-extractor
description: 当需要识别PDF、Word/PPT/Excel、扫描件 OCR的内容并转为Markdown文档、或将HTML转为Markdown便于你处理时，使用此技能，同时具有表格/公式识别、批量文档转换、学术论文/报告解析功能。
---
#  当前PDF、Word/PPT/Excel、扫描件 OCR的内容，转为Markdown文档的能力由MinerU 提供。

## CLI

CLI命令为 `mineru-open-api`

### 安装与更新 CLI

命令若不可用（`command not found`），或要升级到新版本：

```bash
npm install -g mineru-open-api            # 首次安装；升级用 npm install -g mineru-open-api@latest

```
网络原因可使用 `--registry=https://registry.npmjs.org` 尝试通过镜像源解决

验证：`mineru-open-api version`

### 鉴权

鉴权非必须，目前MinerU对简单任务为免鉴权，免收费

鉴权通过在cli命令中携带参数 `--token` ` 使用即 `mineru-open-api --token "token值" `

若用户提供token，可保存到`~/.mineru/token`中，便利以后使用，

## 工作流程 


先判断任务轻重，再选模式——轻任务别浪费流程，重任务别让 flash 的 10MB/20页 限制截断结果：

| 判定条件 | 走哪条 |
|---|---|
| 单文件 ≤10MB 且 ≤20 页、只需 Markdown、无需批量 | `flash-extract`（免 token，直接跑） |
| 需要 docx/html/latex/json 输出 | `extract` |
| 批量文件、超大文件、扫描件 OCR、要 VLM 高精度 | `extract` |
| 网页 URL 转 Markdown | **不走本 skill**|

### 轻量：`flash-extract`（免 token）

```bash
mineru-open-api flash-extract /data/报告.pdf                       # Markdown → stdout
mineru-open-api flash-extract /data/报告.pdf -o ./out/             # 存文件/目录
mineru-open-api flash-extract /data/扫描件.pdf --ocr               # 扫描件 OCR（默认关）
mineru-open-api flash-extract /data/报告.pdf --language en --pages 1-5   # 限语言(range 见下)
```

默认已开公式/表格识别（`--formula=false` / `--table=false` 手动关），OCR 默认关（`--ocr` 打开）。
当因超出文件/页数限制或 HTTP 429 限流失败时，改走 `extract`。

### 复杂：`extract`

需使用 --token "token值"  鉴权

```bash
mineru-open-api extract /data/报告.pdf                              # Markdown → stdout（单输入单格式）
mineru-open-api extract /data/报告.pdf -o ./out/ -f md,docx,latex   # 多格式落地
mineru-open-api extract /data/扫描件.pdf --ocr -o ./out/            # OCR 扫描件
mineru-open-api extract /data/论文.pdf --model vlm -o ./out/        # VLM 复杂版式高精度
mineru-open-api extract /data/*.pdf -o ./results/                   # 批量（必须 -o 目录）
mineru-open-api extract --list /data/files.txt -o ./results/        # 或列表文件一次性批量
cat /data/报告.pdf | mineru-open-api extract --stdin --stdin-name /data/报告.pdf   # 管道喂字节
```

`--model` 三选：`vlm`（复杂版式高精度，极少数可能幻觉）/ `pipeline`（零幻觉，更保守）/ `html`（仅 HTML 页面）。
默认 auto：HTML 文件/URL 自动走 `html`，其余文档走 `vlm`。


## 常用参数速查

| 参数 | 说明 |
|---|---|
| `-o/--output` | 输出文件或目录；省略则 stdout。批量与 docx 等二进制格式必须 `-o` |
| `-f/--format` | `md,json,html,latex,docx`（默认 md；batch 用 -o） |
| `--ocr` | 扫描件 OCR，默认关 |
| `--formula` / `--table` | 公式/表格识别，默认开，`=false` 关闭 |
| `--language` / `-l` | 常用：`ch`（默认，中/英）、`en`（纯英）、`japan`、`korean`。完整清单见 references |
| `--pages` | 页码范围，如 `1-10,15` |
| `--timeout` | 轮询超时秒（默认单文件 300 / 批量 1800） |
| `--list` | 从文件逐行读输入 |

完整逐参数说明（默认值、stdout 规则、格式矩阵）：见 [references/cli-params.md](references/cli-params.md)。
`--language` 全部取值（语言族/语言包）(通常无需使用)：见 [references/languages.md](references/languages.md)。

## 恒常规则
- **传递路径必须使用绝对路径**
- **含空格的路径必须加引号**：`"/data/报告 01.pdf"`——shell 分词会拆坏。
- **stdout 只放解析结果**：进度/错误走 stderr，可安全管道（`extract x.pdf | 下游工具`）。
- **用户未指定 `-o` 且要落地时**，输出目录用 `~/MinerU-Skill/<名>_<源路径MD5前6位>/` 约定。
- **flash 成功后**，若本次会话尚未提过，附带一句 extract 升级路径提示（多格式/大文件/批量）。
- **不要臆造参数**：不确定的旗标先看 `mineru-open-api <cmd> --help` 或 cli-params.md。