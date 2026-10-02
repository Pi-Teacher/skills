# Tavily 常用参数

- `--query "关键词"`: 搜索词。
- `--max_results 5`: 结果数量。
- `--topic news`: 搜索类别, 也可用 `general` 或 `finance`。
- `--time_range week`: 时间范围, `day`、`week`、`month`、`year`; 与 `--topic news` 一起实测返回近期新闻结果。
- `--start_date 2026-01-01`: 此日期之后的结果, 格式为 YYYY-MM-DD;
- `--end_date 2020-12-31`: 此日期之前的结果, 格式为 YYYY-MM-DD;
- `--search_depth advanced`: 检索深度, 常用 `basic` (默认)、`advanced` (更深入, 可能增加延迟与费用)。
- `--country "united states"`: 地区偏好, `"united states"` (美国) 或 `china` (中国); 仅适用于 `--topic general`, 不是严格过滤。
- `--include_raw_content true`: 返回页面正文。
