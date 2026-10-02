# pullpage 选项在各服务商的实际效果

pullpage 把四家抓取服务统一成一套选项，但各家能力并不对等：有的选项会被直接忽略，有的只是近似实现，有的需要客户端后处理。这张表说明每个选项落到具体服务商时到底发生了什么，避免误以为某个选项一定生效。

| 选项 | tavily | exa | firecrawl | jina |
|:-|:-|:-|:-|:-|
| `--format text` | 原样透传 `format=text` | 忽略，本就只返回文本 | 服务商无 text 格式，改用 markdown 后裁剪 | 用 `Accept: text/plain` 请求 |
| `--format html` | 原样透传 | 忽略 | 用 `formats=["html"]` | 用 `X-Return-Format: html` 请求 |
| `--max-chars` | 客户端截断 | 服务端 `text.maxCharacters`，同时只返回正文段 | 客户端截断 | 客户端截断 |
| `--only-main` | 忽略 | 用 `verbosity=compact` 近似 | `onlyMainContent` 直接生效 | 默认即主体内容，无需参数 |
| `--no-cache` | 忽略 | 忽略（始终不强制 livecrawl） | `maxAge=0` | `noCache=true` |
| `--query` | `query` 参数 | `highlights.query` 只回传相关片段 | 忽略 | 忽略 |
| `--extract-depth` | `extract_depth` 参数 | 忽略 | 忽略 | 忽略 |
| `--with-links` | `include_links` | `extras.links` | 响应内 links 字段 | `withLinksSummary` |
| `--timeout` | 参数单位为秒 | `livecrawlTimeout`，单位为毫秒 | `timeout`，单位为毫秒 | 参数单位为秒，且被限制在 1 到 180 之间 |

`--format text` 在 exa 上不会报错，只是没有效果：exa 的 contents 接口本就只返回正文文本，不走 HTML 通道。

`--only-main` 默认开启。关闭时要写 `--only-main=false`，不能写成 `--only-main false`：布尔选项只在等号形式下取值，空格写法会把 `false` 当成位置参数，从而终止后续所有选项的解析。

## 超时

`--timeout` 同时控制两处。单家抓取自己的超时取该值；调度层的全局超时取该值的两倍，因为回退链上多家是串行尝试的，每家都需要用满自己的超时。全局超时先到时，当前请求会被中止并计入失败，继续回退下一家。非正的 `--timeout` 等价于超时立即到期，所有服务商都会即刻失败。

## 回退触发条件

只有三类情况会触发回退：HTTP 状态码达到 400、服务商在响应体内明确标记失败（例如 firecrawl 的 `success=false`、exa 的 `statuses` 非 success）、以及内容为空。HTTP 200 但抓到的是 WAF 拦截页或错误页不属于这三类，不会触发回退，需要自行判断内容是否有意义。

## 退出码

成功返回 0；所有服务商均失败返回 1；参数错误（缺少 `--url`、选项名未知、取值非法）返回 2，此时 usage 打印到 stderr。

## 更多 API 细节

各服务商的字段含义、配额与计费规则以上游文档为准，`doc/` 目录下已缓存官方快照：`tavily.md`、`exa.md`、`firecrwal.md`、`jina.json`。需要确认某个参数是否被上游支持时查阅它们，而不是猜测。
