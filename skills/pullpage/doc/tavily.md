> ## Documentation Index
> Fetch the complete documentation index at: https://docs.tavily.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Tavily Extract

> Extract web page content from one or more specified URLs using Tavily Extract.



## OpenAPI

````yaml POST /extract
openapi: 3.0.3
info:
  title: Tavily Search and Extract API
  description: >-
    Our REST API provides seamless access to Tavily Search, a powerful search
    engine for LLM agents, and Tavily Extract, an advanced web scraping solution
    optimized for LLMs.
  version: 1.0.0
servers:
  - url: https://api.tavily.com/
security: []
tags:
  - name: Search
  - name: Extract
  - name: Crawl
  - name: Map
  - name: Research
  - name: Usage
paths:
  /extract:
    post:
      summary: Retrieve raw web content from specified URLs
      description: >-
        Extract web page content from one or more specified URLs using Tavily
        Extract.
      requestBody:
        description: Parameters for the Tavily Extract request.
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                urls:
                  oneOf:
                    - type: string
                      description: The URL to extract content from.
                      example: https://en.wikipedia.org/wiki/Artificial_intelligence
                    - type: array
                      items:
                        type: string
                      description: A list of URLs to extract content from.
                      example:
                        - https://en.wikipedia.org/wiki/Artificial_intelligence
                        - https://en.wikipedia.org/wiki/Machine_learning
                        - https://en.wikipedia.org/wiki/Data_science
                query:
                  type: string
                  description: >-
                    User intent for reranking extracted content chunks. When
                    provided, chunks are reranked based on relevance to this
                    query.
                chunks_per_source:
                  type: integer
                  description: >-
                    Chunks are short content snippets (maximum 500 characters
                    each) pulled directly from the source. Use
                    `chunks_per_source` to define the maximum number of relevant
                    chunks returned per source and to control the `raw_content`
                    length. Chunks will appear in the `raw_content` field as:
                    `<chunk 1> [...] <chunk 2> [...] <chunk 3>`. Available only
                    when `query` is provided. Must be between 1 and 5.
                  minimum: 1
                  maximum: 5
                  default: 3
                extract_depth:
                  type: string
                  description: >-
                    The depth of the extraction process. `advanced` extraction
                    retrieves more data, including tables and embedded content,
                    with higher success but may increase latency.`basic`
                    extraction costs 1 credit per 5 successful URL extractions,
                    while `advanced` extraction costs 2 credits per 5 successful
                    URL extractions.
                  enum:
                    - basic
                    - advanced
                  default: basic
                include_images:
                  type: boolean
                  description: >-
                    Include a list of images extracted from the URLs in the
                    response. Default is false.
                  default: false
                include_favicon:
                  type: boolean
                  description: Whether to include the favicon URL for each result.
                  default: false
                format:
                  type: string
                  description: >-
                    The format of the extracted web page content. `markdown`
                    returns content in markdown format. `text` returns plain
                    text and may increase latency.
                  enum:
                    - markdown
                    - text
                  default: markdown
                timeout:
                  type: number
                  format: float
                  description: >-
                    Maximum time in seconds to wait for the URL extraction
                    before timing out. Must be between 1.0 and 60.0 seconds. If
                    not specified, default timeouts are applied based on
                    extract_depth: 10 seconds for basic extraction and 30
                    seconds for advanced extraction.
                  minimum: 1
                  maximum: 60
                  default: None
                include_usage:
                  type: boolean
                  description: >-
                    Whether to include credit usage information in the response.
                    `NOTE:`The value may be 0 if the total successful URL
                    extractions has not yet reached 5 calls. See our [Credits &
                    Pricing
                    documentation](https://docs.tavily.com/documentation/api-credits)
                    for details.
                  default: false
              required:
                - urls
      responses:
        '200':
          description: Extraction results returned successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  results:
                    type: array
                    description: A list of extracted content from the provided URLs.
                    items:
                      type: object
                      properties:
                        url:
                          type: string
                          description: The URL from which the content was extracted.
                          example: >-
                            https://en.wikipedia.org/wiki/Artificial_intelligence
                        raw_content:
                          type: string
                          description: >-
                            The full content extracted from the page. When
                            `query` is provided, contains the top-ranked chunks
                            joined by `[...]` separator.
                          example: >-
                            "Jump to content\nMain
                            menu\nSearch\nAppearance\nDonate\nCreate
                            account\nLog in\nPersonal tools\n        Photograph
                            your local culture, help Wikipedia and win!\nToggle
                            the table of contents\nArtificial intelligence\n161
                            languages\nArticle\nTalk\nRead\nView source\nView
                            history\nTools\nFrom Wikipedia, the free
                            encyclopedia\n\"AI\" redirects here. For other uses,
                            see AI (disambiguation) and Artificial intelligence
                            (disambiguation).\nPart of a series on\nArtificial
                            intelligence (AI)\nshow\nMajor
                            goals\nshow\nApproaches\nshow\nApplications\nshow\nPhilosophy\nshow\nHistory\nshow\nGlossary\nvte\nArtificial
                            intelligence (AI), in its broadest sense, is
                            intelligence exhibited by machines, particularly
                            computer systems. It is a field of research in
                            computer science that develops and studies methods
                            and software that enable machines to perceive their
                            environment and use learning and intelligence to
                            take actions that maximize their chances of
                            achieving defined goals.[1] Such machines may be
                            called AIs.\nHigh-profile applications of AI include
                            advanced web search engines (e.g., Google Search);
                            recommendation systems (used by YouTube, Amazon, and
                            Netflix); virtual assistants (e.g., Google
                            Assistant, Siri, and Alexa); autonomous vehicles
                            (e.g., Waymo); generative and creative tools (e.g.,
                            ChatGPT and AI art); and superhuman play and
                            analysis in strategy games (e.g., chess and
                            Go)...................
                        images:
                          type: array
                          example: []
                          description: >-
                            This is only available if `include_images` is set to
                            `true`. A list of image URLs extracted from the
                            page.
                          items:
                            type: string
                        favicon:
                          type: string
                          description: The favicon URL for the result.
                          example: >-
                            https://en.wikipedia.org/static/favicon/wikipedia.ico
                  failed_results:
                    type: array
                    example: []
                    description: A list of URLs that could not be processed.
                    items:
                      type: object
                      properties:
                        url:
                          type: string
                          description: The URL that failed to be processed.
                        error:
                          type: string
                          description: >-
                            An error message describing why the URL couldn't be
                            processed.
                  response_time:
                    type: number
                    format: float
                    description: Time in seconds it took to complete the request.
                    example: 0.02
                  usage:
                    type: object
                    description: Credit usage details for the request.
                    example:
                      credits: 1
                  request_id:
                    type: string
                    description: >-
                      A unique request identifier you can share with customer
                      support to help resolve issues with specific requests.
                    example: 123e4567-e89b-12d3-a456-426614174111
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: <400 Bad Request, (e.g Max 20 URLs are allowed.)>
        '401':
          description: Unauthorized - Your API key is wrong or missing.
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: 'Unauthorized: missing or invalid API key.'
        '429':
          description: Too many requests - Rate limit exceeded
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: >-
                    Your request has been blocked due to excessive requests.
                    Please reduce rate of requests.
        '432':
          description: Key limit or Plan Limit exceeded
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: >-
                    <432 Custom Forbidden Error (e.g This request exceeds your
                    plan's set usage limit. Please upgrade your plan or contact
                    support@tavily.com)>
        '433':
          description: PayGo limit exceeded
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: >-
                    This request exceeds the pay-as-you-go limit. You can
                    increase your limit on the Tavily dashboard.
        '500':
          description: Internal Server Error - We had a problem with our server.
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: Internal Server Error
      security:
        - bearerAuth: []
      x-codeSamples:
        - lang: python
          label: Python SDK
          source: >-
            from tavily import TavilyClient


            tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")

            response =
            tavily_client.extract("https://en.wikipedia.org/wiki/Artificial_intelligence")


            print(response)
        - lang: javascript
          label: JavaScript SDK
          source: >-
            const { tavily } = require("@tavily/core");


            const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

            const response = await
            tvly.extract("https://en.wikipedia.org/wiki/Artificial_intelligence");


            console.log(response);
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: >-
        Bearer authentication header in the form Bearer <token>, where <token>
        is your Tavily API key (e.g., Bearer tvly-YOUR_API_KEY).

````



> ## Documentation Index
> Fetch the complete documentation index at: https://docs.tavily.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Tavily Crawl

> Tavily Crawl is a graph-based website traversal tool that can explore hundreds of paths in parallel with built-in extraction and intelligent discovery.



## OpenAPI

````yaml POST /crawl
openapi: 3.0.3
info:
  title: Tavily Search and Extract API
  description: >-
    Our REST API provides seamless access to Tavily Search, a powerful search
    engine for LLM agents, and Tavily Extract, an advanced web scraping solution
    optimized for LLMs.
  version: 1.0.0
servers:
  - url: https://api.tavily.com/
security: []
tags:
  - name: Search
  - name: Extract
  - name: Crawl
  - name: Map
  - name: Research
  - name: Usage
paths:
  /crawl:
    post:
      summary: Initiate a web crawl from a base URL
      description: >-
        Tavily Crawl is a graph-based website traversal tool that can explore
        hundreds of paths in parallel with built-in extraction and intelligent
        discovery.
      requestBody:
        description: Parameters for the Tavily Crawl request.
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                url:
                  type: string
                  description: The root URL to begin the crawl.
                  example: docs.tavily.com
                instructions:
                  type: string
                  description: >-
                    Natural language instructions for the crawler. When
                    specified, the mapping cost increases to 2 API credits per
                    10 successful pages instead of 1 API credit per 10 pages.
                  example: Find all pages about the Python SDK
                chunks_per_source:
                  type: integer
                  description: >-
                    Chunks are short content snippets (maximum 500 characters
                    each) pulled directly from the source. Use
                    `chunks_per_source` to define the maximum number of relevant
                    chunks returned per source and to control the `raw_content`
                    length. Chunks will appear in the `raw_content` field as:
                    `<chunk 1> [...] <chunk 2> [...] <chunk 3>`. Available only
                    when `instructions` are provided. Must be between 1 and 5.
                  minimum: 1
                  maximum: 5
                  default: 3
                max_depth:
                  type: integer
                  description: >-
                    Max depth of the crawl. Defines how far from the base URL
                    the crawler can explore.
                  default: 1
                  minimum: 1
                  maximum: 5
                max_breadth:
                  type: integer
                  description: >-
                    Max number of links to follow per level of the tree (i.e.,
                    per page).
                  default: 20
                  minimum: 1
                  maximum: 500
                limit:
                  type: integer
                  description: >-
                    Total number of links the crawler will process before
                    stopping.
                  default: 50
                  minimum: 1
                select_paths:
                  type: array
                  description: >-
                    Regex patterns to select only URLs with specific path
                    patterns (e.g., `/docs/.*`, `/api/v1.*`).
                  items:
                    type: string
                  default: null
                select_domains:
                  type: array
                  description: >-
                    Regex patterns to select crawling to specific domains or
                    subdomains (e.g., `^docs\.example\.com$`).
                  items:
                    type: string
                  default: null
                exclude_paths:
                  type: array
                  description: >-
                    Regex patterns to exclude URLs with specific path patterns
                    (e.g., `/private/.*`, `/admin/.*`).
                  items:
                    type: string
                  default: null
                exclude_domains:
                  type: array
                  description: >-
                    Regex patterns to exclude specific domains or subdomains
                    from crawling (e.g., `^private\.example\.com$`).
                  items:
                    type: string
                  default: null
                allow_external:
                  type: boolean
                  description: >-
                    Whether to include external domain links in the final
                    results list.
                  default: true
                include_images:
                  type: boolean
                  description: Whether to include images in the crawl results.
                  default: false
                extract_depth:
                  type: string
                  description: >-
                    Advanced extraction retrieves more data, including tables
                    and embedded content, with higher success but may increase
                    latency. `basic` extraction costs 1 credit per 5 successful
                    extractions, while `advanced` extraction costs 2 credits per
                    5 successful extractions.
                  enum:
                    - basic
                    - advanced
                  default: basic
                format:
                  type: string
                  description: >-
                    The format of the extracted web page content. `markdown`
                    returns content in markdown format. `text` returns plain
                    text and may increase latency.
                  enum:
                    - markdown
                    - text
                  default: markdown
                include_favicon:
                  type: boolean
                  description: Whether to include the favicon URL for each result.
                  default: false
                timeout:
                  type: number
                  format: float
                  description: >-
                    Maximum time in seconds to wait for the crawl operation
                    before timing out. Must be between 10 and 150 seconds.
                  minimum: 10
                  maximum: 150
                  default: 150
                include_usage:
                  type: boolean
                  description: >-
                    Whether to include credit usage information in the response.
                    `NOTE:`The value may be 0 if the total use of /extract and
                    /map have not yet reached minimum requirements. See our
                    [Credits & Pricing
                    documentation](https://docs.tavily.com/documentation/api-credits)
                    for details.
                  default: false
              required:
                - url
      responses:
        '200':
          description: Crawl results returned successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  base_url:
                    type: string
                    description: The base URL that was crawled.
                    example: docs.tavily.com
                  results:
                    type: array
                    description: A list of extracted content from the crawled URLs.
                    items:
                      type: object
                      properties:
                        url:
                          type: string
                          description: The URL that was crawled.
                          example: https://docs.tavily.com
                        raw_content:
                          type: string
                          description: >-
                            The full content extracted from the page. When
                            `query` is provided, contains the top-ranked chunks
                            joined by `[...]` separator.
                        favicon:
                          type: string
                          description: The favicon URL for the result.
                          example: >-
                            https://mintlify.s3-us-west-1.amazonaws.com/tavilyai/_generated/favicon/apple-touch-icon.png?v=3
                    example:
                      - url: https://docs.tavily.com/welcome
                        raw_content: >-
                          Welcome - Tavily Docs


                          [Tavily Docs home page![light
                          logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark
                          logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)


                          Search or ask...


                          Ctrl K


                          - [Support](mailto:support@tavily.com)

                          - [Get an API key](https://app.tavily.com)

                          - [Get an API key](https://app.tavily.com)


                          Search...


                          Navigation


                          [Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)


                          Explore our docs


                          Your journey to state-of-the-art web search starts
                          right here.


                          [## Quickstart


                          Start searching with Tavily in
                          minutes](documentation/quickstart)[## API Reference


                          Start using Tavily's powerful
                          APIs](documentation/api-reference/endpoint/search)[##
                          API Credits Overview


                          Learn how to get and manage your Tavily API
                          Credits](documentation/api-credits)[## Rate Limits


                          Learn about Tavily's API rate limits for both
                          development and production
                          environments](documentation/rate-limits)[## Python


                          Get started with our Python SDK,
                          `tavily-python`](sdk/python/quick-start)[## Playground


                          Explore Tavily's APIs with our interactive
                          playground](https://app.tavily.com/playground)
                        favicon: >-
                          https://mintlify.s3-us-west-1.amazonaws.com/tavilyai/_generated/favicon/apple-touch-icon.png?v=3
                      - url: https://docs.tavily.com/documentation/api-credits
                        raw_content: >-
                          Credits & Pricing - Tavily Docs


                          [Tavily Docs home page![light
                          logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark
                          logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)


                          Search or ask...


                          Ctrl K


                          - [Support](mailto:support@tavily.com)

                          - [Get an API key](https://app.tavily.com)

                          - [Get an API key](https://app.tavily.com)


                          Search...


                          Navigation


                          Overview


                          Credits & Pricing


                          [Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)


                          - [API Playground](https://app.tavily.com/playground)

                          - [Community](https://community.tavily.com)

                          - [Blog](https://blog.tavily.com)


                          ##### Overview


                          - [About](/documentation/about)

                          - [Quickstart](/documentation/quickstart)

                          - [Credits & Pricing](/documentation/api-credits)

                          - [Rate Limits](/documentation/rate-limits)


                          ##### API Reference


                          -
                          [Introduction](/documentation/api-reference/introduction)

                          - [POST

                            Tavily Search](/documentation/api-reference/endpoint/search)
                          - [POST

                            Tavily Extract](/documentation/api-reference/endpoint/extract)
                          - [POST

                            Tavily Crawl](/documentation/api-reference/endpoint/crawl)
                          - [POST

                            Tavily Map](/documentation/api-reference/endpoint/map)

                          ##### Best Practices


                          - [Best Practices for
                          Search](/documentation/best-practices/best-practices-search)

                          - [Best Practices for
                          Extract](/documentation/best-practices/best-practices-extract)


                          ##### Tavily MCP Server


                          - [Tavily MCP Server](/documentation/mcp)


                          ##### Integrations


                          - [LangChain](/documentation/integrations/langchain)

                          - [LlamaIndex](/documentation/integrations/llamaindex)

                          - [Zapier](/documentation/integrations/zapier)

                          - [Dify](/documentation/integrations/dify)

                          - [Composio](/documentation/integrations/composio)

                          - [Make](/documentation/integrations/make)

                          - [Agno](/documentation/integrations/agno)

                          - [Pydantic
                          AI](/documentation/integrations/pydantic-ai)

                          - [FlowiseAI](/documentation/integrations/flowise)


                          ##### Legal


                          - [Security & Compliance](https://trust.tavily.com)

                          - [Privacy Policy](https://tavily.com/privacy)


                          ##### Help


                          - [Help Center](https://help.tavily.com)


                          ##### Tavily Search Crawler


                          - [Tavily Search
                          Crawler](/documentation/search-crawler)


                          Overview


                          # Credits & Pricing


                          Learn how to get and manage your Tavily API Credits.


                          ## [​](#free-api-credits) Free API Credits


                          [## Get your free API key


                          You get 1,000 free API Credits every month.

                          **No credit card required.**](https://app.tavily.com)


                          ## [​](#pricing-overview) Pricing Overview


                          Tavily operates on a simple, credit-based model:


                          - **Free**: 1,000 credits/month

                          - **Pay-as-you-go**: $0.008 per credit (allows you to
                          be charged per credit once your plan's credit limit is
                          reached).

                          - **Monthly plans**: $0.0075 - $0.005 per credit

                          - **Enterprise**: Custom pricing and volume


                          | **Plan** | **Credits per month** | **Monthly price**
                          | **Price per credit** |

                          | --- | --- | --- | --- |

                          | **Researcher** | 1,000 | Free | - |

                          | **Project** | 4,000 | $30 | $0.0075 |

                          | **Bootstrap** | 15,000 | $100 | $0.0067 |

                          | **Startup** | 38,000 | $220 | $0.0058 |

                          | **Growth** | 100,000 | $500 | $0.005 |

                          | **Pay as you go** | Per usage | $0.008 / Credit |
                          $0.008 |

                          | **Enterprise** | Custom | Custom | Custom |


                          Head to [my plan](https://app.tavily.com/account/plan)
                          to explore our different options and manage your plan.


                          ## [​](#api-credits-costs) API Credits Costs


                          ### [​](#tavily-search) Tavily Search


                          Your [search
                          depth](/api-reference/endpoint/search#body-search-depth)
                          determines the cost of your request.


                          - **Basic Search (`basic`):**
                            Each request costs **1 API credit**.
                          - **Advanced Search (`advanced`):**
                            Each request costs **2 API credits**.

                          ### [​](#tavily-extract) Tavily Extract


                          The number of successful URL extractions and your
                          [extraction
                          depth](/api-reference/endpoint/extract#body-extract-depth)
                          determines the cost of your request. You never get
                          charged if a URL extraction fails.


                          - **Basic Extract (`basic`):**
                            Every 5 successful URL extractions cost **1 API credit**
                          - **Advanced Extract (`advanced`):**
                            Every 5 successful URL extractions cost **2 API credits**

                          [Quickstart](/documentation/quickstart)[Rate
                          Limits](/documentation/rate-limits)


                          [x](https://x.com/tavilyai)[github](https://github.com/tavily-ai)[linkedin](https://linkedin.com/company/tavily)[website](https://tavily.com)


                          [Powered by
                          Mintlify](https://mintlify.com/preview-request?utm_campaign=poweredBy&utm_medium=docs&utm_source=docs.tavily.com)


                          On this page


                          - [Free API Credits](#free-api-credits)

                          - [Pricing Overview](#pricing-overview)

                          - [API Credits Costs](#api-credits-costs)

                          - [Tavily Search](#tavily-search)

                          - [Tavily Extract](#tavily-extract)
                        favicon: >-
                          https://mintlify.s3-us-west-1.amazonaws.com/tavilyai/_generated/favicon/apple-touch-icon.png?v=3
                      - url: https://docs.tavily.com/documentation/about
                        raw_content: >-
                          Who are we?

                          -----------


                          We're a team of AI researchers and developers
                          passionate about helping you build the next generation
                          of AI assistants. Our mission is to empower
                          individuals and organizations with accurate, unbiased,
                          and factual information.


                          What is the Tavily Search Engine?

                          ---------------------------------


                          Building an AI agent that leverages realtime online
                          information is not a simple task. Scraping doesn't
                          scale and requires expertise to refine, current search
                          engine APIs don't provide explicit information to
                          queries but simply potential related articles (which
                          are not always related), and are not very customziable
                          for AI agent needs. This is why we're excited to
                          introduce the first search engine for AI agents -
                          [Tavily](https://app.tavily.com/).


                          Tavily is a search engine optimized for LLMs, aimed at
                          efficient, quick and persistent search results. Unlike
                          other search APIs such as Serp or Google, Tavily
                          focuses on optimizing search for AI developers and
                          autonomous AI agents. We take care of all the burden
                          of searching, scraping, filtering and extracting the
                          most relevant information from online sources. All in
                          a single API call!


                          To try the API in action, you can now use our hosted
                          version on our [API
                          Playground](https://app.tavily.com/playground).


                          Why choose Tavily?

                          ------------------


                          Tavily shines where others fail, with a Search API
                          optimized for LLMs.


                          How does the Search API work?

                          -----------------------------


                          Traditional search APIs such as Google, Serp and Bing
                          retrieve search results based on a user query.
                          However, the results are sometimes irrelevant to the
                          goal of the search, and return simple URLs and
                          snippets of content which are not always relevant.
                          Because of this, any developer would need to then
                          scrape the sites to extract relevant content, filter
                          irrelevant information, optimize the content to fit
                          LLM context limits, and more. This task is a burden
                          and requires a lot of time and effort to complete. The
                          Tavily Search API takes care of all of this for you in
                          a single API call.


                          The Tavily Search API aggregates up to 20 sites per a
                          single API call, and uses proprietary AI to score,
                          filter and rank the top most relevant sources and
                          content to your task, query or goal. In addition,
                          Tavily allows developers to add custom fields such as
                          context and limit response tokens to enable the
                          optimal search experience for LLMs.


                          Tavily can also help your AI agent make better
                          decisions by including a short answer for cross-agent
                          communication.


                          Getting started

                          ---------------


                          [Sign up](https://app.tavily.com/) for Tavily to get
                          your API key. You get **1,000 free API Credits every
                          month**. No credit card required.


                          [Get your free API key --------------------- You get
                          1,000 free API Credits every month. **No credit card
                          required.**](https://app.tavily.com/)Head to our [API
                          Playground](https://app.tavily.com/playground) to
                          familiarize yourself with our API.


                          To get started with Tavily's APIs and SDKs using code,
                          head to our [Quickstart
                          Guide](https://docs.tavily.com/guides/quickstart) and
                          follow the steps.
                        favicon: >-
                          https://mintlify.s3-us-west-1.amazonaws.com/tavilyai/_generated/favicon/apple-touch-icon.png?v=3
                  response_time:
                    type: number
                    format: float
                    description: Time in seconds it took to complete the request.
                    example: 1.23
                  usage:
                    type: object
                    description: Credit usage details for the request.
                    example:
                      credits: 1
                  request_id:
                    type: string
                    description: >-
                      A unique request identifier you can share with customer
                      support to help resolve issues with specific requests.
                    example: 123e4567-e89b-12d3-a456-426614174111
        '400':
          description: Bad Request - Your request is invalid.
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: '[400] No starting url provided'
        '401':
          description: Unauthorized - Your API key is wrong or missing.
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: 'Unauthorized: missing or invalid API key.'
        '403':
          description: Forbidden - URL is not supported.
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: '[403] URL is not supported'
        '429':
          description: Too many requests - Rate limit exceeded
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: >-
                    Your request has been blocked due to excessive requests.
                    Please reduce rate of requests.
        '432':
          description: Key limit or Plan Limit exceeded
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: >-
                    This request exceeds your plan's set usage limit. Please
                    upgrade your plan or contact support@tavily.com
        '433':
          description: PayGo limit exceeded
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: >-
                    This request exceeds the pay-as-you-go limit. You can
                    increase your limit on the Tavily dashboard.
        '500':
          description: Internal Server Error - We had a problem with our server.
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: '[500] Internal server error'
      security:
        - bearerAuth: []
      x-codeSamples:
        - lang: python
          label: Python SDK
          source: >-
            from tavily import TavilyClient


            tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")

            response = tavily_client.crawl("https://docs.tavily.com",
            instructions="Find all pages on the Python SDK")


            print(response)
        - lang: javascript
          label: JavaScript SDK
          source: >-
            const { tavily } = require("@tavily/core");


            const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

            const response = await tvly.crawl("https://docs.tavily.com", {
            instructions: "Find all pages on the Python SDK" });


            console.log(response);
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: >-
        Bearer authentication header in the form Bearer <token>, where <token>
        is your Tavily API key (e.g., Bearer tvly-YOUR_API_KEY).

````

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.tavily.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Tavily Map

> Tavily Map traverses websites like a graph and can explore hundreds of paths in parallel with intelligent discovery to generate comprehensive site maps.



## OpenAPI

````yaml POST /map
openapi: 3.0.3
info:
  title: Tavily Search and Extract API
  description: >-
    Our REST API provides seamless access to Tavily Search, a powerful search
    engine for LLM agents, and Tavily Extract, an advanced web scraping solution
    optimized for LLMs.
  version: 1.0.0
servers:
  - url: https://api.tavily.com/
security: []
tags:
  - name: Search
  - name: Extract
  - name: Crawl
  - name: Map
  - name: Research
  - name: Usage
paths:
  /map:
    post:
      summary: Initiate a web mapping from a base URL
      description: >-
        Tavily Map traverses websites like a graph and can explore hundreds of
        paths in parallel with intelligent discovery to generate comprehensive
        site maps.
      requestBody:
        description: Parameters for the Tavily Map request.
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                url:
                  type: string
                  description: The root URL to begin the mapping.
                  example: docs.tavily.com
                instructions:
                  type: string
                  description: >-
                    Natural language instructions for the crawler. When
                    specified, the cost increases to 2 API credits per 10
                    successful pages instead of 1 API credit per 10 pages.
                  example: Find all pages about the Python SDK
                  default: null
                max_depth:
                  type: integer
                  description: >-
                    Max depth of the mapping. Defines how far from the base URL
                    the crawler can explore.
                  default: 1
                  minimum: 1
                  maximum: 5
                max_breadth:
                  type: integer
                  description: >-
                    Max number of links to follow per level of the tree (i.e.,
                    per page).
                  default: 20
                  minimum: 1
                  maximum: 500
                limit:
                  type: integer
                  description: >-
                    Total number of links the crawler will process before
                    stopping.
                  default: 50
                  minimum: 1
                select_paths:
                  type: array
                  description: >-
                    Regex patterns to select only URLs with specific path
                    patterns (e.g., `/docs/.*`, `/api/v1.*`).
                  items:
                    type: string
                  default: null
                select_domains:
                  type: array
                  description: >-
                    Regex patterns to select crawling to specific domains or
                    subdomains (e.g., `^docs\.example\.com$`).
                  items:
                    type: string
                  default: null
                exclude_paths:
                  type: array
                  description: >-
                    Regex patterns to exclude URLs with specific path patterns
                    (e.g., `/private/.*`, `/admin/.*`).
                  items:
                    type: string
                  default: null
                exclude_domains:
                  type: array
                  description: >-
                    Regex patterns to exclude specific domains or subdomains
                    from crawling (e.g., `^private\.example\.com$`).
                  items:
                    type: string
                  default: null
                allow_external:
                  type: boolean
                  description: >-
                    Whether to include external domain links in the final
                    results list.
                  default: true
                timeout:
                  type: number
                  format: float
                  description: >-
                    Maximum time in seconds to wait for the map operation before
                    timing out. Must be between 10 and 150 seconds.
                  minimum: 10
                  maximum: 150
                  default: 150
                include_usage:
                  type: boolean
                  description: >-
                    Whether to include credit usage information in the
                    response.`NOTE:`The value may be 0 if the total successful
                    pages mapped has not yet reached 10 calls. See our [Credits
                    & Pricing
                    documentation](https://docs.tavily.com/documentation/api-credits)
                    for details.
                  default: false
              required:
                - url
      responses:
        '200':
          description: Map results returned successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  base_url:
                    type: string
                    description: The base URL that was mapped.
                    example: docs.tavily.com
                  results:
                    type: array
                    description: A list of URLs that were discovered during the mapping.
                    items:
                      type: string
                      example: docs.tavily.com
                    example:
                      - https://docs.tavily.com/welcome
                      - https://docs.tavily.com/documentation/api-credits
                      - https://docs.tavily.com/documentation/about
                  response_time:
                    type: number
                    format: float
                    description: Time in seconds it took to complete the request.
                    example: 1.23
                  usage:
                    type: object
                    description: Credit usage details for the request.
                    example:
                      credits: 1
                  request_id:
                    type: string
                    description: >-
                      A unique request identifier you can share with customer
                      support to help resolve issues with specific requests.
                    example: 123e4567-e89b-12d3-a456-426614174111
        '400':
          description: Bad Request - Your request is invalid.
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: '[400] No starting url provided'
        '401':
          description: Unauthorized - Your API key is wrong or missing.
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: 'Unauthorized: missing or invalid API key.'
        '403':
          description: Forbidden - URL is not supported.
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: '[403] URL is not supported'
        '429':
          description: Too many requests - Rate limit exceeded
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: >-
                    Your request has been blocked due to excessive requests.
                    Please reduce rate of requests.
        '432':
          description: Key limit or Plan Limit exceeded
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: >-
                    This request exceeds your plan's set usage limit. Please
                    upgrade your plan or contact support@tavily.com
        '433':
          description: PayGo limit exceeded
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: >-
                    This request exceeds the pay-as-you-go limit. You can
                    increase your limit on the Tavily dashboard.
        '500':
          description: Internal Server Error - We had a problem with our server.
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: '[500] Internal server error'
      security:
        - bearerAuth: []
      x-codeSamples:
        - lang: python
          label: Python SDK
          source: |-
            from tavily import TavilyClient

            tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")
            response = tavily_client.map("https://docs.tavily.com")

            print(response)
        - lang: javascript
          label: JavaScript SDK
          source: |-
            const { tavily } = require("@tavily/core");

            const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });
            const response = await tvly.map("https://docs.tavily.com");

            console.log(response);
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: >-
        Bearer authentication header in the form Bearer <token>, where <token>
        is your Tavily API key (e.g., Bearer tvly-YOUR_API_KEY).

````