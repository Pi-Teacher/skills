# SearXNG 常用参数

- `--query "关键词"`: 搜索词, 映射为上游 `q`。
- `--language en`: 搜索语言, `en` (英语) 或 `zh-CN` (简体中文) 是待实例验证的示例; 当前未配置可调用实例, 不保证目标实例支持或严格过滤。
- `--engines google,bing`: 搜索引擎, 常见 `google`、`bing`; 必须由实例启用。
- `--categories general`: 搜索类别, 常见 `general` (网页)、`news` (新闻); 必须由实例启用。
- `--pageno 2`: 搜索页码。
- `--time_range month`: 时间范围, 取决于实例和引擎支持情况;
