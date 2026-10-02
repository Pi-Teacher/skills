# Context7 进阶用法

普通「搜库 / 拉文档」不需要读本文件。需要调 `--type`/`--fast`、遇到非 200 响应、或需要拼 libraryId 时再看。

## 参数

`--query`（两个命令都必填）：自然语言问题，越具体检索排序越准。

`--libraryName`（`search` 必填）：库名或关键词，如 `nextjs`。

`--libraryId`（`context` 必填）：库 ID，格式见下。

`--type`（仅 `context`，默认 `json`）：`json` 返回结构化结果；`txt` 返回格式化文本，适合直接给人读。合法值：json 或 txt。

`--fast`（两个命令）：跳过 LLM 重排，直接返回向量检索结果，更快但相关性略低。合法值：true 或 false。

`--apiKey`（两个命令）：临时覆盖 key，优先级最高。

`--baseUrl`（两个命令）：临时覆盖 base URL。

## libraryId 格式

GitHub 仓库：`/owner/repo`，如 `/vercel/next.js`。

GitLab / Bitbucket / 其它 Git：形状同 GitHub，`/owner/repo`，如 `/gitlab-org/gitlab`。

网站：`/websites/<id>`，如 `/websites/uploadcare`。

llms.txt：`/llmstxt/<source>`，如 `/llmstxt/example`。

npm / 包：`/packages/<name>` 或 `/npm/<name>`，如 `/packages/react`。

上传文档：`/docs/<name>`，如 `/docs/mystuff`。

固定版本：在 ID 后加 `/<version>` 或 `@<version>`，如 `/vercel/next.js/v15.1.8`、`/vercel/next.js@v15.1.8`。

不确定 ID 时先 `search`，用返回的 `results[0].id`。

## 非 200 响应

脚本不根据状态码改退出码，body 原样透传。读取 body 里的 `error` / `message` 判断情况。

200：正常，处理 `results` / `codeSnippets` / `infoSnippets`。

202 `library_not_finalized`：库还在处理，稍后再试。

301 `library_redirected`：库已迁移，用 body 里的 `redirectUrl` 作为新 `--libraryId` 重新请求。

400 `validation_error` / `invalid_library_id`：参数错误，检查 `--libraryName` / `--libraryId` / `--query`。

401 `invalid_api_key`：key 无效，检查是否以 `ctx7sk` 开头。

402 `spending_limit_exceeded`：团队月度额度用尽。

403 `access_denied` / `forbidden`：库不在允许列表，或权限/套餐不足。

404 `library_not_found` / `tag_not_found`：库或版本不存在，检查 ID。

409 `conflict`：资源已存在（多见于 add 类接口）。

422 `library_too_large` / `no_code_found`：库过大或没有可提取代码。

429 `rate_limit_exceeded`：触发限流，参考响应头 `Retry-After` 稍后重试。

500 / 503 / 504 `internal_error` / `search_failed`：服务端问题，稍后重试。
