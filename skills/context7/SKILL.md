---
name: context7
description: 使用 Context7 查询第三方库/框架的官方文档、API 参考与代码示例。当用户问某个具体库怎么用、要该库的 API 文档、或问题涉及框架特有概念（hooks、routing、middleware、ORM、schema）与 import/require 某个库时使用。不要在通用编程概念（闭包、递归、设计模式）、代码审查/重构、调试业务逻辑、与特定库文档无关的通用联网搜索上触发。
---

# Context7

通过 `scripts/context7` 调用 Context7 API（路径相对本 SKILL.md 所在目录）。响应为原始 JSON，原样透传返回，不加工。

## 何时用

用户需要某个具体库/框架的官方文档、API 参考、用法示例或版本相关行为时；问题里出现框架特有概念（hooks、routing、middleware、ORM、schema）或 import/require 某库时。

## 何时不用

通用编程概念（闭包、递归、设计模式）、代码审查与重构、调试业务逻辑、从零写脚本且不涉及特定库文档——这些不要触发本 skill。

## 两个命令

名称搜索库、拿到库 ID：`scripts/context7 search --libraryName <name> --query <query>`

按库 ID + 问题拉取文档片段：`scripts/context7 context --libraryId <id> --query <query>`

查看帮助：`scripts/context7 --help`

## 工作流

先用 `search`，从返回的 `results[0].id` 拿到库 ID，再用 `context` 传入该 ID 获取文档。选结果时优先官方来源（`/vercel/next.js` 优于社区 fork），可参考 `stars`、`benchmarkScore` 排序。已知库 ID（如 `/vercel/next.js`）时可直接 `context`。

`--query` 用具体自然语言问题、尽量聚焦（"如何用 middleware 实现鉴权" 优于 "鉴权"）。

## 配置

优先级：CLI 参数 > 本 skill 目录 `.env` > 系统环境变量。

`CONTEXT7_API_KEY`：必需，在 https://context7.com/dashboard 获取，以 `ctx7sk` 开头。

`CONTEXT7_BASE_URL`：默认 `https://context7.com/api`。

缺 key 时提示用户在本 skill 目录的 `.env` 里填写 `CONTEXT7_API_KEY`，或用 `--apiKey` 传入。不要把 key 写进命令行。

## 进阶

`--type`（默认 `json`）、`--fast`、`--baseUrl`、libraryId 格式与错误码含义，见 [references/api.md](references/api.md)。
