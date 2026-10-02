# AI 清洗与失败排查

只有上游请求成功后才进入 AI 清洗。使用 `--ai` 时需 `PLATYPUS_AI_FORMAT` (`openai`、`anthropic` 或 `gemini`)、`PLATYPUS_AI_API_KEY`、`PLATYPUS_AI_MODEL`；可选 `PLATYPUS_AI_BASE_URL`。`--prompt` 必须放在 `search` 前并同时启用 `--ai`，会替换默认清洗要求；未加 `--ai` 时输出原始 JSON。

AI 失败会以退出码 1 结束，stdout 只显示 `/tmp/platypus-error-<provider>-<本地毫秒时间戳>.json` 的路径提示。文件含 `provider`、`error`、`rawResponse`；后者是上游原始 JSON 文本字符串，可能含敏感信息。只在本机检查并谨慎清理，不向用户或公共日志粘贴完整文件。若没有诊断路径而 stderr 报错，先排查上游调用、配置文件读取或诊断文件写入错误。

`404` 先检查 `PLATYPUS_AI_BASE_URL` 与协议：OpenAI 的地址末段被替换为 `/v1` 后由 SDK 请求 `/chat/completions`；Anthropic 原样传给 SDK；Gemini 用作 SDK `httpOptions.baseUrl`。`401/403` 检查 AI key、协议与模型权限，`429` 查模型配额，输出为空则检查模型响应。不要把 Provider key 与独立的 AI key 混为一谈。

`PLATYPUS_AI_STREAMBLE=true` 时 OpenAI/Anthropic 使用 SDK 流式聚合，Gemini 始终非流式。Anthropic 必须指定输出上限，CLI 默认 `PLATYPUS_AI_MAX_TOKENS=8192`；模型不支持该值时按其上限调整。原始搜索响应过长导致输入上下文超限时，减少该 Provider 的结果数量或正文内容；调高输出 token 上限无法增加输入上下文。
