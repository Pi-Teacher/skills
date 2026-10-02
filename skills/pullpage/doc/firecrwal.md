> ## Documentation Index
> Fetch the complete documentation index at: https://docs.firecrawl.dev/llms.txt
> Use this file to discover all available pages before exploring further.

# Scrape

<div id="interactions">
  ## 交互
</div>

对于浏览器交互 (点击、输入、导航、提取动态内容) ，请使用[交互端点](/zh/features/interact)。先抓取页面，然后调用 `POST /v2/scrape/{scrapeId}/interact`，并使用自然语言提示或 Playwright 代码在页面上执行操作。

完整详情和示例，请参见[交互文档](/zh/features/interact)。

你也可以选择使用 `actions` 参数，但不建议将其用于复杂交互。

> 你是需要 Firecrawl API 密钥的 AI 代理吗？请参见 [firecrawl.dev/agent-onboarding/SKILL.md](https://www.firecrawl.dev/agent-onboarding/SKILL.md) 获取自动化引导说明。


## OpenAPI

````yaml zh/api-reference/v2-openapi.json POST /scrape
openapi: 3.0.0
info:
  contact:
    email: support@firecrawl.dev
    name: Firecrawl Support
    url: https://firecrawl.dev/support
  description: 用于与 Firecrawl 服务交互，执行网页抓取和爬取任务的 API。
  title: Firecrawl API
  version: v2
servers:
  - url: https://api.firecrawl.dev/v2
security:
  - bearerAuth: []
paths:
  /scrape:
    post:
      tags:
        - Scraping
      summary: 抓取单个 URL，并可选用 LLM 提取信息
      operationId: scrapeAndExtractFromUrl
      requestBody:
        content:
          application/json:
            schema:
              allOf:
                - properties:
                    url:
                      description: 要爬取的 URL
                      format: uri
                      type: string
                  required:
                    - url
                  type: object
                - $ref: '#/components/schemas/ScrapeOptions'
                - properties:
                    zeroDataRetention:
                      default: false
                      description: 如果为 true，则本次抓取将不保留任何数据。要启用此功能，请联系 help@firecrawl.dev
                      type: boolean
                  type: object
        required: true
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ScrapeResponse'
          description: 成功响应
        '402':
          content:
            application/json:
              schema:
                properties:
                  error:
                    example: Payment required to access this resource.
                    type: string
                type: object
          description: 需要付费
        '429':
          content:
            application/json:
              schema:
                properties:
                  error:
                    example: >-
                      Request rate limit exceeded. Please wait and try again
                      later.
                    type: string
                type: object
          description: 请求过多
        '500':
          content:
            application/json:
              schema:
                properties:
                  code:
                    example: UNKNOWN_ERROR
                    type: string
                  error:
                    example: An unexpected error occurred on the server.
                    type: string
                  success:
                    example: false
                    type: boolean
                type: object
          description: 服务器错误
      security:
        - bearerAuth: []
components:
  schemas:
    ScrapeOptions:
      properties:
        actions:
          description: 在抓取页面内容之前需要执行的页面 actions
          items:
            oneOf:
              - oneOf:
                  - additionalProperties: false
                    properties:
                      milliseconds:
                        description: 要等待的毫秒数
                        minimum: 1
                        type: integer
                      type:
                        description: 等待指定的毫秒数
                        enum:
                          - wait
                        type: string
                    required:
                      - type
                      - milliseconds
                    title: Wait by Duration
                    type: object
                  - additionalProperties: false
                    properties:
                      selector:
                        description: 用于等待的 CSS 选择器
                        example: '#my-element'
                        type: string
                      type:
                        description: 等待特定元素出现
                        enum:
                          - wait
                        type: string
                    required:
                      - type
                      - selector
                    title: Wait for Element
                    type: object
                title: Wait
              - properties:
                  fullPage:
                    default: false
                    description: 是否捕获整个页面的截图（忽略 viewport.height），还是仅截取当前视口区域。
                    type: boolean
                  quality:
                    description: 截图质量，取值范围为 1 到 100，100 为最高质量。
                    type: integer
                  type:
                    description: 截取屏幕截图。链接将在响应的 `actions.screenshots` 数组中返回。
                    enum:
                      - screenshot
                    type: string
                  viewport:
                    properties:
                      height:
                        description: 视口高度（以像素为单位）
                        type: integer
                      width:
                        description: 以像素为单位的视口宽度
                        type: integer
                    required:
                      - width
                      - height
                    type: object
                required:
                  - type
                title: Screenshot
                type: object
              - properties:
                  all:
                    default: false
                    description: 点击所有匹配该选择器的元素，而不仅仅是第一个。即使没有任何元素匹配该选择器，也不会抛出错误。
                    type: boolean
                  selector:
                    description: 用于查找元素的查询选择器
                    example: '#load-more-button'
                    type: string
                  type:
                    description: 单击一个元素
                    enum:
                      - click
                    type: string
                required:
                  - type
                  - selector
                title: Click
                type: object
              - properties:
                  text:
                    description: 要键入的文本
                    example: Hello, world!
                    type: string
                  type:
                    description: >-
                      向输入框、文本区域或 contenteditable
                      元素写入文本。注意：在写入之前，你必须先使用「click」操作使该元素获得焦点。文本将以逐字符方式输入，以模拟键盘输入。
                    enum:
                      - write
                    type: string
                required:
                  - type
                  - text
                title: Write text
                type: object
              - description: >-
                  请在页面上按下一个按键。按键代码请参见：https://asawicki.info/nosense/doc/devices/keyboard/key_codes.html。
                properties:
                  key:
                    description: 要按的键
                    example: Enter
                    type: string
                  type:
                    description: 在页面上按下任意键
                    enum:
                      - press
                    type: string
                required:
                  - type
                  - key
                title: Press a key
                type: object
              - properties:
                  direction:
                    default: down
                    description: 滚动方向
                    enum:
                      - up
                      - down
                    type: string
                  selector:
                    description: 用于滚动的元素选择器
                    example: '#my-element'
                    type: string
                  type:
                    description: 滚动整个页面或某个特定元素
                    enum:
                      - scroll
                    type: string
                required:
                  - type
                title: Scroll
                type: object
              - properties:
                  type:
                    description: 抓取当前页面内容，并返回其 URL 和 HTML。
                    enum:
                      - scrape
                    type: string
                required:
                  - type
                title: Scrape
                type: object
              - properties:
                  script:
                    description: 待执行的 JavaScript 代码
                    example: document.querySelector('.button').click();
                    type: string
                  type:
                    description: 在页面上执行 JavaScript 代码
                    enum:
                      - executeJavascript
                    type: string
                required:
                  - type
                  - script
                title: Execute JavaScript
                type: object
              - properties:
                  format:
                    default: Letter
                    description: 生成的 PDF 的页面大小
                    enum:
                      - A0
                      - A1
                      - A2
                      - A3
                      - A4
                      - A5
                      - A6
                      - Letter
                      - Legal
                      - Tabloid
                      - Ledger
                    type: string
                  landscape:
                    default: false
                    description: 是否以横向方向生成 PDF
                    type: boolean
                  scale:
                    default: 1
                    description: 生成 PDF 的缩放比例
                    type: number
                  type:
                    description: 生成当前页面的 PDF 文件。该 PDF 文件会通过响应中的 `actions.pdfs` 数组返回。
                    enum:
                      - pdf
                    type: string
                required:
                  - type
                title: Generate PDF
                type: object
          type: array
        auditMetadata:
          $ref: '#/components/schemas/AuditMetadata'
        blockAds:
          default: true
          description: 启用广告拦截和 Cookie 弹窗拦截功能。
          type: boolean
        excludeTags:
          description: 在输出中需要排除的标签。
          items:
            type: string
          type: array
        formats:
          $ref: '#/components/schemas/Formats'
        headers:
          description: 随请求发送的请求头。可用于传递 cookies、User-Agent 等信息。
          type: object
        includeTags:
          description: 在输出中要包含的标签。
          items:
            type: string
          type: array
        location:
          description: 请求的地理位置设置。指定后，如果有可用的代理，将使用合适的代理，并模拟相应的语言和时区设置。如果未指定，则默认为“US”。
          properties:
            country:
              default: US
              description: ISO 3166-1 alpha-2 国家/地区代码（例如：“US”、“AU”、“DE”、“JP”）
              pattern: ^[A-Z]{2}$
              type: string
            languages:
              description: >-
                按优先级排序的请求首选语言和区域设置。默认为指定位置的语言。详情请参阅：https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language
              items:
                example: en-US
                type: string
              type: array
          type: object
        lockdown:
          default: false
          description: >-
            如果为 true，则仅从 Firecrawl 的缓存中返回该请求的结果，绝不会向目标 URL
            发出外部请求。此选项专为受合规要求限制或隔离网络环境而设计，因为爬取请求本身可能会泄露敏感信息。若缓存未命中，则返回 404 和错误代码
            SCRAPE_LOCKDOWN_CACHE_MISS（未命中时绝不会记录该 URL）。Lockdown 请求按零数据保留处理。默认
            maxAge 会延长至 2 年，因此现有缓存页面仍然仍可使用。命中缓存时计费 5 个额度，缓存未命中时计费 1 个额度。
          type: boolean
        maxAge:
          default: 172800000
          description: >-
            如果页面的缓存版本的生成时间距今少于该毫秒数，则返回该缓存页面；如果缓存版本距今超过该时间，则会重新抓取页面。若你不需要特别新的数据，启用此选项可将抓取速度提升至
            5 倍。默认值为 2 天。
          type: integer
        minAge:
          description: |-
            <[
              {
                "key": "0",
                "translation": "设置后，请求将仅检查缓存，不会触发新的抓取。该值以毫秒为单位，指定缓存数据必须满足的最小存在时长。如果存在匹配的缓存数据，将立即返回。若未找到缓存数据，则返回 404，错误代码为 SCRAPE_NO_CACHED_DATA。将其设为 1 可接受任意缓存数据，不受时长限制。"
              }
            ]</>
          type: integer
        mobile:
          default: false
          description: 若要模拟在移动设备上进行抓取，请将其设置为 true。适用于测试响应式页面并获取移动端截图。
          type: boolean
        onlyCleanContent:
          default: false
          description: >-
            测试版。在已生成的 markdown 上额外执行一轮基于 LLM 的处理，以移除 `onlyMainContent`
            可能遗漏的残余样板内容（如 cookie
            横幅、广告块、社交分享组件、面包屑导航、新闻简报订阅区、评论区、相关文章列表）。标题、列表、表格、代码块、图片引用和内联链接都会保留。可与
            `onlyMainContent` 结合使用（最常见的配置），也可单独使用。当 markdown 超过清理模型的输出 token
            限制时，将跳过此步骤并发出警告（原始 markdown 会保留）。不支持零数据保留请求。
          type: boolean
        onlyMainContent:
          default: true
          description: 仅返回页面主体内容，不包括页眉、导航栏、页脚等。这是在生成 markdown 之前应用的确定性 HTML 层级过滤；不涉及 LLM。
          type: boolean
        parsers:
          default:
            - pdf
          description: >-
            用于控制在抓取过程中如何处理文件。包含 "pdf" 时（默认），会提取 PDF 内容并转换为 Markdown 格式，计费基于页数（每页
            1 点数）。当传入空数组时，会以 base64 编码返回整个 PDF 文件，并对整份 PDF 按单一费率收取 1 点数。
          items:
            oneOf:
              - additionalProperties: false
                properties:
                  maxPages:
                    description: 从该 PDF 中最多解析的页数。必须为不超过 10000 的正整数。
                    maximum: 10000
                    minimum: 1
                    type: integer
                  mode:
                    default: auto
                    description: >-
                      PDF 解析模式。"fast"：仅执行基于文本的提取（提取内嵌文本，速度最快）。"auto"（默认）：优先尝试
                      fast 提取，如有需要再回退到 OCR。"ocr"：对每一页强制执行 OCR 识别。
                    enum:
                      - fast
                      - auto
                      - ocr
                    type: string
                  type:
                    enum:
                      - pdf
                    type: string
                required:
                  - type
                type: object
          type: array
        profile:
          description: >-
            在抓取和交互会话之间启用持久化浏览器存储。抓取时传入一个 profile，以保留 cookies、localStorage
            和会话数据。使用相同 profile 名称的会话会共享浏览器状态。
          properties:
            name:
              description: 配置文件的名称。使用相同名称的抓取任务会共享浏览器状态（cookies、localStorage、会话）。
              maxLength: 128
              minLength: 1
              type: string
            saveChanges:
              default: true
              description: >-
                为 true 时，交互会话停止后，浏览器状态会保存回该 profile。设为 false
                则只加载现有数据而不写入。同一时间只允许一个会话执行保存。
              type: boolean
          required:
            - name
          type: object
        proxy:
          default: auto
          description: |-
            指定要使用的代理类型。

             - **basic**：用于抓取几乎没有或只有基础反爬策略的网站的代理。速度快，通常可用。
             - **enhanced**：用于抓取具有高级反爬策略的网站的增强型代理。速度较慢，但在某些站点上更可靠。每个请求最多消耗 5 点积分。
             - **auto**：当 basic 代理抓取失败时，Firecrawl 会自动重试并切换为 enhanced 代理。如果使用 enhanced 重试成功，该次抓取将收取 5 点积分；如果使用 basic 一次就成功，则只按常规定价计费。
          enum:
            - basic
            - enhanced
            - auto
          type: string
        redactPII:
          default: false
          description: 对返回的 markdown 中的个人身份识别信息进行脱敏。传入 `true` 可使用默认值，或传入一个对象来自定义模式、实体和替换样式。
          oneOf:
            - type: boolean
            - $ref: '#/components/schemas/RedactPIIOptions'
        removeBase64Images:
          default: true
          description: >-
            从 markdown 输出中移除所有 base 64 图像，以避免输出内容过长。这不会影响 html 或 rawHtml
            formats。图像的 alt 文本会保留在输出中，但 URL 会替换为占位符。
          type: boolean
        skipTlsVerification:
          default: true
          description: 在发起请求时跳过 TLS 证书验证。
          type: boolean
        storeInCache:
          default: true
          description: >-
            如果为 true，该页面会存储到 Firecrawl 的索引和缓存中。如果你的抓取操作可能涉及数据保护方面的顾虑，将其设置为 false
            会很有用。使用某些与敏感抓取相关的参数（例如 actions、headers）时，会被强制将此参数设为 false。
          type: boolean
        threatProtection:
          $ref: '#/components/schemas/ThreatProtectionOverride'
        timeout:
          default: 60000
          description: 请求超时时间（以毫秒为单位）。最小值为 1000（1 秒）。默认值为 60000（60 秒）。最大值为 300000（300 秒）。
          maximum: 300000
          minimum: 1000
          type: integer
        waitFor:
          default: 0
          description: 指定在抓取内容前的延迟时间（毫秒），以便页面有足够时间完成加载。该等待时间是在 Firecrawl 的智能等待功能基础上的额外等待。
          type: integer
      type: object
    ScrapeResponse:
      properties:
        data:
          properties:
            actions:
              description: '`actions` 参数中指定的 actions 的执行结果。仅当请求中提供了 `actions` 参数时才会返回。'
              nullable: true
              properties:
                javascriptReturns:
                  description: 与所提供的 executeJavascript actions 顺序一致的 JavaScript 返回值。
                  items:
                    properties:
                      type:
                        type: string
                      value: {}
                    type: object
                  type: array
                pdfs:
                  description: 按提供的 pdf actions 的顺序生成的 PDF。
                  items:
                    type: string
                  type: array
                scrapes:
                  description: 按照所提供的 scrape actions 顺序抓取内容。
                  items:
                    properties:
                      html:
                        type: string
                      url:
                        type: string
                    type: object
                  type: array
                screenshots:
                  description: 截图 URL，顺序与提供的 screenshot actions 保持一致。
                  items:
                    format: url
                    type: string
                  type: array
              type: object
            answer:
              description: >-
                通过 `question` 格式提供的问题的自然语言答案。仅当 `formats` 中包含 `question`
                格式对象时才会出现。
              nullable: true
              type: string
            audio:
              description: >-
                如果 `formats` 中包含 `audio`，则返回提取后的 MP3 音频文件的签名 URL。该签名 URL 会在 1
                小时后过期。
              nullable: true
              type: string
            branding:
              description: 如果在 `formats` 中包含 `branding`，则会从页面中提取品牌相关信息，包括颜色、字体、版式、间距、组件等。
              nullable: true
              properties:
                animations:
                  description: 动效与过渡配置。
                  nullable: true
                  type: object
                colorScheme:
                  description: 页面检测到的配色方案。
                  enum:
                    - light
                    - dark
                  type: string
                colors:
                  description: 从页面中提取的品牌颜色。
                  nullable: true
                  properties:
                    accent:
                      description: 强调色（十六进制颜色值）。
                      type: string
                    background:
                      description: 背景颜色（十六进制颜色值）。
                      type: string
                    error:
                      description: 错误 / 危险状态颜色（十六进制）。
                      type: string
                    link:
                      description: 链接颜色（十六进制颜色值）。
                      type: string
                    primary:
                      description: 主品牌颜色（十六进制颜色值）。
                      type: string
                    secondary:
                      description: 次要品牌颜色（十六进制颜色值）。
                      type: string
                    success:
                      description: 成功 / 正向状态颜色（十六进制）。
                      type: string
                    textPrimary:
                      description: 主文本颜色（十六进制颜色值）。
                      type: string
                    textSecondary:
                      description: 次要文本颜色（十六进制颜色值）。
                      type: string
                    warning:
                      description: 警告状态颜色（十六进制）。
                      type: string
                  type: object
                components:
                  description: UI 组件样式规范。
                  nullable: true
                  properties:
                    buttonPrimary:
                      description: 主按钮样式规范。
                      properties:
                        background:
                          type: string
                        borderRadius:
                          type: string
                        textColor:
                          type: string
                      type: object
                    buttonSecondary:
                      description: 次级按钮样式配置。
                      properties:
                        background:
                          type: string
                        borderColor:
                          type: string
                        borderRadius:
                          type: string
                        textColor:
                          type: string
                      type: object
                    input:
                      description: 输入框样式配置。
                      type: object
                  type: object
                fonts:
                  description: 页面中使用的字体族数组。
                  items:
                    properties:
                      family:
                        description: 字体族名称。
                        type: string
                    type: object
                  nullable: true
                  type: array
                icons:
                  description: 图标样式配置。
                  nullable: true
                  type: object
                images:
                  description: 品牌相关图片。
                  nullable: true
                  properties:
                    favicon:
                      description: 网站图标（favicon）URL。
                      type: string
                    logo:
                      description: Logo 图片 URL。
                      type: string
                    ogImage:
                      description: Open Graph 图片 URL。
                      type: string
                  type: object
                layout:
                  description: 布局配置（栅格、页眉/页脚高度）。
                  nullable: true
                  type: object
                logo:
                  description: 主徽标的 URL。
                  nullable: true
                  type: string
                personality:
                  description: 品牌个性特征（语气、活力、目标受众）。
                  nullable: true
                  type: object
                spacing:
                  description: 间距与布局相关信息。
                  nullable: true
                  properties:
                    baseUnit:
                      description: 基准间距（像素）。
                      type: integer
                    borderRadius:
                      description: 默认圆角半径。
                      type: string
                    margins:
                      description: 外边距（margin）规格。
                      type: object
                    padding:
                      description: 内边距（padding）规格。
                      type: object
                  type: object
                typography:
                  description: 详细的排版配置。
                  nullable: true
                  properties:
                    fontFamilies:
                      description: 按角色划分的字体族配置。
                      properties:
                        code:
                          description: 代码 / 等宽字体族。
                          type: string
                        heading:
                          description: 标题字体族。
                          type: string
                        primary:
                          description: 主字体族。
                          type: string
                      type: object
                    fontSizes:
                      description: 各文本层级的字体大小。
                      properties:
                        body:
                          type: string
                        h1:
                          type: string
                        h2:
                          type: string
                        h3:
                          type: string
                      type: object
                    fontWeights:
                      description: 字重（font weight）规范。
                      properties:
                        bold:
                          type: integer
                        light:
                          type: integer
                        medium:
                          type: integer
                        regular:
                          type: integer
                      type: object
                    lineHeights:
                      description: 各类文本的行高（line-height）。
                      properties:
                        body:
                          type: string
                        heading:
                          type: string
                      type: object
                  type: object
              type: object
            changeTracking:
              description: >-
                当 `formats` 中包含 `changeTracking` 时的变更追踪信息。仅在请求 `changeTracking`
                格式时才会返回。
              nullable: true
              properties:
                changeStatus:
                  description: >-
                    两个页面版本之间的比较结果。`new` 表示该页面之前不存在，`same` 表示内容没有变化，`changed`
                    表示内容已发生变化，`removed` 表示该页面已被移除。
                  enum:
                    - new
                    - same
                    - changed
                    - removed
                  type: string
                diff:
                  description: 在使用“git-diff”模式时的 Git 风格变更 diff。仅在模式设置为“git-diff”时返回。
                  nullable: true
                  type: string
                json:
                  description: >-
                    使用 `json` 模式时的 JSON 比较结果。仅在模式设置为 `json` 时返回。该字段会根据 `schema`
                    中定义的类型，输出一个列表，包含 `previous` 和 `current` 抓取结果中的所有键及其对应的值。示例见
                    [此处](/features/change-tracking)
                  nullable: true
                  type: object
                previousScrapeAt:
                  description: 当前页面用于对比的上一次抓取时间戳。如果不存在之前的抓取，则为 null。
                  format: date-time
                  nullable: true
                  type: string
                visibility:
                  description: >-
                    当前页面/URL 的可见性。`visible` 表示该 URL 是通过自然途径（链接或站点地图）发现的，`hidden`
                    表示该 URL 是通过之前抓取的历史记录（“记忆”）发现的。
                  enum:
                    - visible
                    - hidden
                  type: string
              type: object
            highlights:
              description: >-
                由 `highlights` 格式选取的相关源文本。仅当 `formats` 中包含 `highlights`
                格式对象时才会出现。
              nullable: true
              type: string
            html:
              description: >-
                如果 `formats` 中包含 `html`，则返回页面清洗后的 HTML 内容。会移除
                `<script>`、`<style>`、`<noscript>`、`<meta>` 和 `<head>` 标签；将相对 URL
                转换为绝对 URL；将响应式图片的 `srcset` 解析为分辨率最高的版本。遵循
                `onlyMainContent`、`includeTags` 和 `excludeTags` 过滤器。
              nullable: true
              type: string
            links:
              description: 当 `formats` 中包含 `links` 时，页面上的链接列表
              items:
                type: string
              type: array
            markdown:
              type: string
            menu:
              description: >-
                如果 `formats` 中包含
                `menu`，则返回从页面提取的菜单信息。包括商家、货币以及分区列表；每个分区都包含条目，每个条目带有描述、图片、价格、可用性、饮食标签、卡路里和选项组。
              nullable: true
              properties:
                confidence:
                  description: 菜单提取的 0 到 1 之间的置信度分数。
                  type: number
                currency:
                  description: 菜单的 ISO 4217 货币代码（例如 `'USD'`），仅在页面提供该信息时返回。
                  type: string
                isMenu:
                  description: 该页面是否被识别为菜单。
                  type: boolean
                merchant:
                  description: 该菜单所属的商家。
                  properties:
                    name:
                      description: 商家名称。
                      type: string
                    type:
                      description: 商家类型（例如 `'restaurant'`）。
                      type: string
                  required:
                    - name
                  type: object
                sections:
                  description: 菜单分区（例如 `'Appetizers'`、`'Entrees'`）。
                  items:
                    properties:
                      description:
                        description: 分区描述。
                        nullable: true
                        type: string
                      id:
                        description: 分区标识符。
                        type: string
                      items:
                        description: 分区中的条目。
                        items:
                          properties:
                            availability:
                              description: 条目的可用性。
                              properties:
                                inStock:
                                  description: 该条目是否可用。
                                  type: boolean
                                text:
                                  description: 便于人类阅读的可用性文本。
                                  nullable: true
                                  type: string
                              required:
                                - inStock
                              type: object
                            calories:
                              description: 该条目的卡路里数。
                              nullable: true
                              type: number
                            description:
                              description: 条目描述。
                              nullable: true
                              type: string
                            dietary:
                              description: 条目的饮食标签（例如 `['vegetarian']`）。
                              items:
                                type: string
                              type: array
                            id:
                              description: 条目标识符。
                              type: string
                            identifiers:
                              description: 该条目的商家专属标识符。
                              properties:
                                merchantItemId:
                                  description: 商家自己的条目 ID。
                                  type: string
                              type: object
                            images:
                              description: 条目图片。
                              items:
                                properties:
                                  alt:
                                    description: 图片的替代文本。
                                    nullable: true
                                    type: string
                                  url:
                                    description: 图片 URL。
                                    type: string
                                required:
                                  - url
                                type: object
                              type: array
                            name:
                              description: 条目名称。
                              type: string
                            optionGroups:
                              description: 该条目的选项/附加项分组。
                              items:
                                type: object
                              type: array
                            price:
                              description: 条目的价格。
                              properties:
                                amount:
                                  description: 价格数值。
                                  type: number
                                currency:
                                  description: ISO 4217 货币代码（例如 `'USD'`）。
                                  type: string
                                formatted:
                                  description: 用于显示的格式化价格（例如 `'$7.99'`）。
                                  type: string
                              required:
                                - amount
                              type: object
                            sourceUrl:
                              description: 提取该条目时的来源 URL。
                              nullable: true
                              type: string
                            url:
                              description: 该条目的规范 URL。
                              nullable: true
                              type: string
                          required:
                            - name
                          type: object
                        type: array
                      name:
                        description: 分区名称。
                        type: string
                    required:
                      - name
                      - items
                    type: object
                  type: array
                sourceUrl:
                  description: 提取菜单时的来源 URL。
                  nullable: true
                  type: string
              required:
                - isMenu
                - sections
              type: object
            metadata:
              properties:
                '<any other metadata> ':
                  description: 从 HTML 提取的其他元数据，可以是字符串或字符串数组
                  oneOf:
                    - type: string
                    - items:
                        type: string
                      type: array
                concurrencyLimited:
                  description: 此次抓取是否因团队并发限制而被限流
                  type: boolean
                concurrencyQueueDurationMs:
                  description: 该请求在并发队列中的等待时间（毫秒）。仅当 concurrencyLimited 为 true 时返回。
                  type: number
                contentType:
                  description: 页面的内容类型（MIME 类型），如 text/html、application/pdf
                  type: string
                description:
                  description: 从页面提取的描述，可以是字符串或字符串数组。
                  oneOf:
                    - type: string
                    - items:
                        type: string
                      type: array
                error:
                  description: 页面错误信息
                  nullable: true
                  type: string
                keywords:
                  description: 从页面中提取的关键词，可以是字符串或字符串数组
                  oneOf:
                    - type: string
                    - items:
                        type: string
                      type: array
                language:
                  description: 从页面提取的语言，可以是字符串或字符串数组
                  nullable: true
                  oneOf:
                    - type: string
                    - items:
                        type: string
                      type: array
                numPages:
                  description: 对于 PDF 输入，表示已解析的页数（上限由解析器的 maxPages 选项决定）。
                  type: integer
                ogLocaleAlternate:
                  description: 页面的其他可用语言版本
                  items:
                    type: string
                  type: array
                sourceURL:
                  description: 发起请求时使用的原始 URL。如果发生重定向，可能与最终页面的 URL 不一致。
                  format: uri
                  type: string
                statusCode:
                  description: 页面状态码
                  type: integer
                title:
                  description: 从页面提取的标题，可以是一个字符串或字符串数组
                  oneOf:
                    - type: string
                    - items:
                        type: string
                      type: array
                totalPages:
                  description: >-
                    对于 PDF 输入，表示文档在应用任何 maxPages 限制前的实际总页数。无法确定时将省略；如果
                    totalPages 大于 numPages，则表示结果已被截断。
                  type: integer
                url:
                  description: 跟随所有重定向后得到的最终页面 URL。
                  format: uri
                  type: string
              type: object
            product:
              description: >-
                如果 `formats` 中包含
                `product`，则返回从页面提取的产品信息。包括标题、品牌、类别、描述和变体。价格、库存状态和图片位于各个变体中。
              nullable: true
              properties:
                brand:
                  description: 产品品牌或制造商。
                  type: string
                category:
                  description: 产品类别，也可选填为面包屑路径（例如“Electronics > Audio > Headphones”）。
                  type: string
                description:
                  description: 产品描述。
                  type: string
                title:
                  description: 产品标题。
                  type: string
                url:
                  description: 产品页面的 canonical URL。
                  type: string
                variants:
                  description: 产品变体（例如不同颜色或尺寸）。
                  items:
                    properties:
                      availability:
                        description: 变体的库存状态。该字段在变体中始终存在。
                        properties:
                          inStock:
                            description: 该变体是否有库存。
                            type: boolean
                          text:
                            description: 便于人类阅读的库存状态文本（例如“有库存”）。
                            type: string
                        required:
                          - inStock
                        type: object
                      id:
                        description: 变体标识符。
                        type: string
                      images:
                        description: 变体图片。
                        items:
                          properties:
                            alt:
                              description: 图片的替代文本。
                              type: string
                            url:
                              description: 图片 URL。
                              type: string
                          required:
                            - url
                          type: object
                        type: array
                      price:
                        description: 变体的当前价格。
                        properties:
                          amount:
                            description: 数值形式的价格金额。
                            type: number
                          currency:
                            description: ISO 4217 货币代码（例如“USD”）。
                            type: string
                          formatted:
                            description: 用于显示的格式化价格（例如“$199.99”）。
                            type: string
                        required:
                          - amount
                        type: object
                      sale:
                        description: 变体的促销/折扣信息，在该变体有折扣时提供。
                        properties:
                          originalPrice:
                            description: 变体的原价（折扣前价格）。
                            properties:
                              amount:
                                description: 数值形式的价格金额。
                                type: number
                              currency:
                                description: ISO 4217 货币代码（例如“USD”）。
                                type: string
                              formatted:
                                description: 用于显示的格式化价格（例如“$249.99”）。
                                type: string
                            required:
                              - amount
                            type: object
                        required:
                          - originalPrice
                        type: object
                      sku:
                        description: 变体 SKU。
                        type: string
                      title:
                        description: 变体标题。
                        type: string
                      values:
                        additionalProperties:
                          type: string
                        description: '变体选项值（例如 { "color": "Black" }）。'
                        type: object
                    required:
                      - availability
                    type: object
                  type: array
              required:
                - title
                - url
                - variants
              type: object
            rawHtml:
              description: >-
                如果在 `formats` 中指定 `rawHtml`，则会返回页面的原始
                HTML（未作任何修改）。不会执行任何清理或过滤操作。
              nullable: true
              type: string
            screenshot:
              description: 如果在 `formats` 中包含 `screenshot`，则会返回页面截图。截图将在 24 小时后过期，届时将无法再下载。
              nullable: true
              type: string
            summary:
              description: 如果 `formats` 中包含 `summary`，则返回页面摘要
              nullable: true
              type: string
            video:
              description: 如果 `formats` 中包含 `video`，则返回提取后视频文件的签名 URL。该签名 URL 会在 1 小时后过期。
              nullable: true
              type: string
            warning:
              description: 在使用 LLM Extraction 时会显示。警告信息会提示你提取过程中的任何问题。
              nullable: true
              type: string
          type: object
        success:
          type: boolean
      type: object
    AuditMetadata:
      additionalProperties: false
      description: 为组织启用 SIEM Logging 后，SIEM 日志事件中会包含用户归属信息。
      properties:
        username:
          description: 与该请求关联的用户名。
          maxLength: 1024
          type: string
      required:
        - username
      type: object
    Formats:
      default:
        - markdown
      description: >-
        要在响应中包含的输出 formats。你可以指定一个或多个
        formats，既可以使用字符串（例如：`'markdown'`），也可以使用带有其他选项的对象（例如：`{ type: 'json',
        schema: {...} }`）。某些 formats 需要配置特定选项。示例：`['markdown', { type: 'json',
        schema: {...} }]`。
      items:
        oneOf:
          - properties:
              type:
                enum:
                  - markdown
                type: string
            required:
              - type
            title: Markdown
            type: object
          - properties:
              type:
                enum:
                  - summary
                type: string
            required:
              - type
            title: Summary
            type: object
          - properties:
              type:
                enum:
                  - html
                type: string
            required:
              - type
            title: HTML
            type: object
          - properties:
              type:
                enum:
                  - rawHtml
                type: string
            required:
              - type
            title: Raw HTML
            type: object
          - properties:
              type:
                enum:
                  - links
                type: string
            required:
              - type
            title: Links
            type: object
          - properties:
              type:
                enum:
                  - images
                type: string
            required:
              - type
            title: Images
            type: object
          - properties:
              fullPage:
                default: false
                description: 是否捕获整个页面的截图（忽略 viewport.height），还是仅截取当前视口区域。
                type: boolean
              quality:
                description: 截图质量，范围为 1 到 100，100 为最高质量。
                type: integer
              type:
                enum:
                  - screenshot
                type: string
              viewport:
                properties:
                  height:
                    description: 视口高度（像素）
                    type: integer
                  width:
                    description: 视口宽度（像素）
                    type: integer
                required:
                  - width
                  - height
                type: object
            required:
              - type
            title: Screenshot
            type: object
          - properties:
              prompt:
                description: 用于生成 JSON 输出的提示
                type: string
              schema:
                description: >-
                  用于 JSON 输出的 Schema，必须符合 [JSON
                  Schema](https://json-schema.org/) 规范。
                type: object
              type:
                enum:
                  - json
                type: string
            required:
              - type
            title: JSON
            type: object
          - properties:
              modes:
                description: 用于变更跟踪的模式。`git-diff` 提供详细的差异对比，而 `json` 则对比提取出的 JSON 数据。
                items:
                  enum:
                    - git-diff
                    - json
                  type: string
                type: array
              prompt:
                description: 在使用 `json` 模式进行变更跟踪时要使用的提示词。如果未提供，将使用默认提示词。
                type: string
              schema:
                description: >-
                  在使用「json」模式进行 JSON 提取时所用的 schema。用于定义要提取和对比的数据结构。必须符合 [JSON
                  Schema](https://json-schema.org/) 标准。
                type: object
              tag:
                default: null
                description: >-
                  用于变更跟踪的标签。标签可以将变更跟踪历史划分为不同的「分支」，带有特定标签的变更跟踪只会与同一标签下的抓取结果进行比较。如果未提供，则会使用默认标签（null）。
                nullable: true
                type: string
              type:
                enum:
                  - changeTracking
                type: string
            required:
              - type
            title: Change Tracking
            type: object
          - properties:
              type:
                enum:
                  - branding
                type: string
            required:
              - type
            title: Branding
            type: object
          - properties:
              type:
                enum:
                  - product
                type: string
            required:
              - type
            title: Product
            type: object
          - properties:
              type:
                enum:
                  - menu
                type: string
            required:
              - type
            title: Menu
            type: object
          - description: 从受支持的视频 URL（如 YouTube）中提取音频（MP3）。返回已签名的 GCS URL。
            properties:
              type:
                enum:
                  - audio
                type: string
            required:
              - type
            title: Audio
            type: object
          - description: 从受支持的视频 URL（如 YouTube）中提取最高画质的视频。返回已签名的 GCS URL。
            properties:
              type:
                enum:
                  - video
                type: string
            required:
              - type
            title: Video
            type: object
          - description: 针对页面提出自然语言问题。答案会在响应的 `answer` 字段中返回。
            properties:
              question:
                description: 要回答的页面相关问题。最大长度为 10,000 个字符。
                maxLength: 10000
                type: string
              type:
                enum:
                  - question
                type: string
            required:
              - type
              - question
            title: Question
            type: object
          - description: 从页面中查找相关源文本。选中的文本会在响应的 `highlights` 字段中返回。
            properties:
              query:
                description: 要对页面执行的文本选择查询。最大长度为 10,000 个字符。
                maxLength: 10000
                type: string
              type:
                enum:
                  - highlights
                type: string
            required:
              - type
              - query
            title: Highlights
            type: object
      type: array
    RedactPIIOptions:
      additionalProperties: false
      description: PII 脱敏的配置选项。
      properties:
        entities:
          description: 将脱敏限制为这些实体类别。如果省略，则会对所有支持的实体进行脱敏。
          items:
            $ref: '#/components/schemas/RedactPIIEntity'
          type: array
        mode:
          default: accurate
          description: >-
            脱敏策略。`accurate` 仅使用模型，针对准确性进行了优化；`aggressive` 通过额外的启发式规则提高召回率；`fast`
            则仅使用启发式规则，不调用模型。
          enum:
            - accurate
            - aggressive
            - fast
          type: string
        replaceStyle:
          default: tag
          description: >-
            `tag` 会将文本片段替换为 `<EMAIL>` 这类占位符，`mask` 会用 `*` 替换字符，`remove`
            会删除该文本片段。
          enum:
            - tag
            - mask
            - remove
          type: string
      type: object
    ThreatProtectionOverride:
      description: >-
        此请求的[威胁防护](https://docs.firecrawl.dev/features/threat-protection)按请求覆盖配置。你提供的字段仅会替换此次请求中你所在组织策略的对应字段；未提供的字段则保留组织级配置值。你的团队必须已启用威胁防护（企业版功能），否则该请求会因
        403 被拒绝。如果你的组织已禁用请求级覆盖，任何包含此对象的请求都会因 403 被拒绝。如果你的团队强制启用了威胁防护，则不得将 `mode`
        设为 `off`。
      properties:
        blacklist:
          description: 始终封禁的域名，可使用普通域名（`example.com`）或通配符模式（`*.example.com`）。不包含协议、路径或端口。
          items:
            type: string
          maxItems: 1000
          type: array
        blockedTlds:
          description: 直接封禁的顶级域名，使用不带前导点的小写形式（例如 `zip`）。
          items:
            type: string
          maxItems: 1000
          type: array
        failurePolicy:
          description: 当无法访问 classifier 时的处理方式：`closed` 会封禁该请求，`open` 则允许该请求。
          enum:
            - open
            - closed
          type: string
        mode:
          description: >-
            此次请求的 URL 扫描模式。`normal` 使用 Google Web Risk 检查 URL（每扫描 1 个 URL 额外消耗 2
            个额度）。
          enum:
            - 'off'
            - normal
          type: string
        riskScoreThreshold:
          description: 归一化风险评分（0–100）阈值。达到或超过该值时，分类器判定会封禁该 URL。值越低，限制越严格。
          example: 75
          maximum: 100
          minimum: 0
          type: integer
        whitelist:
          description: 始终允许的域名，可使用普通域名或通配符模式。优先级高于其他所有规则。
          items:
            type: string
          maxItems: 1000
          type: array
      title: Threat Protection Override
      type: object
    RedactPIIEntity:
      description: Firecrawl 脱敏支持的公开 PII 实体类别。
      enum:
        - PERSON
        - EMAIL
        - PHONE
        - LOCATION
        - FINANCIAL
        - SECRET
      type: string
  securitySchemes:
    bearerAuth:
      scheme: bearer
      type: http

````