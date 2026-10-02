# Exa 常用参数

- `--query "关键词"`: 搜索词。
- `--numResults 5`: 结果数量。
- `--type auto`: 搜索类型, 常用 `auto` (自动)、`fast` (低延迟)、`deep` (深度)。
- `--category news`: 搜索类别, 常用 `news` (新闻)、`research paper` (论文)、`company` (公司)、`people` (人物); 含空格的值加引号。
- `--userLocation US`: 用户所在国家代码, `US` (美国) 或 `CN` (中国); 不是严格的结果地区过滤。
- `--startPublishedDate 2026-01-01T00:00:00.000Z`: 筛选此时之后发布的页面
- `--endPublishedDate 2020-12-31T23:59:59.000Z`: 筛选此时之前发布的页面

当前搜索请求没有已确认的专用语言筛选参数; 用中文或英文 `--query` 搜索不能视为严格语言筛选。
- `--contents '{"highlights":true}'`: 获取重点摘录。
- `--contents '{"text":true}'`: 获取页面正文。
