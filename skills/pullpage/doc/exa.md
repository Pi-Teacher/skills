> ## Documentation Index
> Fetch the complete documentation index at: https://exa.ai/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Contents API Reference

> Best practices, examples, and API reference for your coding agent

## Overview

**Endpoint:** `POST https://api.exa.ai/contents`

**Auth:** Pass your API key via the `Authorization: Bearer` header. Get one at [https://dashboard.exa.ai/api-keys](https://dashboard.exa.ai/api-keys)

The Contents API extracts clean, LLM-ready content from any URL. It handles JavaScript-rendered pages, PDFs, and complex layouts. Returns full text, highlights, summaries, or any combination.

## Installation

```bash theme={null}
pip install exa-py    # Python
npm install exa-js    # JavaScript
```

## Minimal Working Example

```bash theme={null}
curl -X POST "https://api.exa.ai/contents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EXA_API_KEY" \
  -d '{"urls": ["https://example.com"], "text": true}'
```

```python theme={null}
from exa_py import Exa
exa = Exa()
result = exa.get_contents(["https://example.com"], text=True)
```

```javascript theme={null}
import Exa from "exa-js";
const exa = new Exa();
const result = await exa.getContents(["https://example.com"], { text: true });
```

## Request Parameters

| Parameter           | Type                | Default        | Description                                                                                                                                                                                                          |
| ------------------- | ------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `urls`              | string\[]           | **(required)** | Array of URLs to extract content from. Also accepts `ids` (document IDs from search results).                                                                                                                        |
| `text`              | boolean or object   | —              | Return full page text as markdown. Object form: `{maxCharacters, includeHtmlTags, verbosity, includeSections, excludeSections}`.                                                                                     |
| `highlights`        | boolean or object   | —              | Return key excerpts relevant to a query. Pass `true` for the highest-quality default. Object form: `{query, maxCharacters}` — use `query` to guide which highlights are returned, `maxCharacters` to cap the budget. |
| `summary`           | boolean or object   | —              | Return LLM-generated summary. Object form: `{query, schema}`.                                                                                                                                                        |
| `maxAgeHours`       | integer             | —              | Max age of cached content in hours. `0` = always livecrawl. `-1` = never livecrawl. Omit for default (livecrawl as fallback).                                                                                        |
| `livecrawlTimeout`  | integer             | `10000`        | Timeout for livecrawling in milliseconds. Recommended: 10000-15000.                                                                                                                                                  |
| `subpages`          | integer             | `0`            | Number of subpages to crawl from each URL.                                                                                                                                                                           |
| `subpageTarget`     | string or string\[] | —              | Keywords to prioritize when selecting subpages.                                                                                                                                                                      |
| `extras.links`      | integer             | `0`            | Number of URLs to extract from each page.                                                                                                                                                                            |
| `extras.imageLinks` | integer             | `0`            | Number of image URLs to extract from each page.                                                                                                                                                                      |
| `compliance`        | string              | —              | Enterprise-only compliance mode. Set to `"hipaa"` for HIPAA mode. Uses cache-only retrieval; summaries and livecrawl are not supported.                                                                              |

### Text Object Options

| Parameter         | Type      | Default     | Description                                                                                                                                                 |
| ----------------- | --------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `maxCharacters`   | integer   | —           | Character limit for returned text.                                                                                                                          |
| `includeHtmlTags` | boolean   | `false`     | Preserve HTML tags in output.                                                                                                                               |
| `verbosity`       | string    | `"compact"` | `compact`, `standard`, or `full`. Should use `maxAgeHours: 0` for fresh content.                                                                            |
| `includeSections` | string\[] | —           | Only include these page sections: `header`, `navigation`, `banner`, `body`, `sidebar`, `footer`, `metadata`. Should use `maxAgeHours: 0` for fresh content. |
| `excludeSections` | string\[] | —           | Exclude these page sections. Same options as above. Should use `maxAgeHours: 0` for fresh content.                                                          |

### Highlights Object Options

Prefer `highlights: true` for the highest-quality default. Only supply this object when you specifically need to guide selection with a custom query or cap output size.

| Parameter       | Type    | Default | Description                                                                                                                             |
| --------------- | ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `query`         | string  | —       | Custom query that guides which highlights the LLM picks.                                                                                |
| `maxCharacters` | integer | —       | Cap on total highlight characters per URL. Omit unless you have a specific budget — leaving it unset gives the highest-quality default. |

### Summary Object Options

| Parameter | Type   | Default | Description                                          |
| --------- | ------ | ------- | ---------------------------------------------------- |
| `query`   | string | —       | Custom query for the summary.                        |
| `schema`  | object | —       | JSON Schema (Draft 7) for structured summary output. |

## Content Modes

**Text** — Full page content as clean markdown. Best for deep analysis.

```json theme={null}
{"urls": ["https://example.com"], "text": {"maxCharacters": 8000}}
```

**Highlights** — Extractive key excerpts from the page. Best for agent workflows (10x fewer tokens). These are pulled directly from the source, not generated.

```json theme={null}
{"urls": ["https://example.com"], "highlights": {"query": "key findings"}}
```

**Summary** — LLM-generated abstract. Supports JSON schema for structured extraction.

```json theme={null}
{
  "urls": ["https://example.com"],
  "summary": {
    "query": "Extract company information",
    "schema": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "industry": {"type": "string"}
      },
      "required": ["name", "industry"]
    }
  }
}
```

You can combine all three in a single request.

## Content Freshness

| `maxAgeHours` value  | Behavior                                                       |
| -------------------- | -------------------------------------------------------------- |
| Omit (default)       | Livecrawl only when no cached content exists. **Recommended.** |
| Positive (e.g. `24`) | Use cache if less than N hours old, otherwise livecrawl.       |
| `0`                  | Always livecrawl, never use cache. Increases latency.          |
| `-1`                 | Never livecrawl, cache only. Maximum speed.                    |

When using `maxAgeHours`, pair with `livecrawlTimeout` (10000-15000ms recommended).

## Subpage Crawling

Automatically discover and extract content from linked pages within a site.

```json theme={null}
{
  "urls": ["https://docs.example.com"],
  "subpages": 10,
  "subpageTarget": ["api", "reference", "guide"],
  "text": {"maxCharacters": 5000}
}
```

* `subpages`: Max subpages to crawl per URL.
* `subpageTarget`: Keywords to prioritize when selecting which subpages to crawl.
* Start small (5-10) and increase if needed.

## Response Schema

```json theme={null}
{
  "requestId": "e492118ccdedcba5088bfc4357a8a125",
  "results": [
    {
      "title": "Page Title",
      "url": "https://example.com/page",
      "id": "https://example.com/page",
      "publishedDate": "2024-01-15T00:00:00.000Z",
      "author": "Author Name",
      "image": "https://example.com/image.png",
      "favicon": "https://example.com/favicon.ico",
      "text": "Full page content as markdown...",
      "highlights": ["Key excerpt from the page..."],
      "highlightScores": [0.46],
      "summary": "LLM-generated summary...",
      "subpages": [],
      "extras": {
        "links": ["https://example.com/related"]
      }
    }
  ],
  "statuses": [
    {
      "id": "https://example.com/page",
      "status": "success"
    }
  ],
  "costDollars": {
    "total": 0.003
  }
}
```

### Response Fields

| Field                             | Type            | Description                                                  |
| --------------------------------- | --------------- | ------------------------------------------------------------ |
| `requestId`                       | string          | Unique request identifier.                                   |
| `results`                         | array           | List of result objects with extracted content.               |
| `results[].title`                 | string          | Page title.                                                  |
| `results[].url`                   | string          | Page URL.                                                    |
| `results[].id`                    | string          | Document ID (same as URL).                                   |
| `results[].publishedDate`         | string or null  | Estimated publication date.                                  |
| `results[].author`                | string or null  | Author if available.                                         |
| `results[].text`                  | string          | Full page text (if `text` requested).                        |
| `results[].highlights`            | string\[]       | Key excerpts (if `highlights` requested).                    |
| `results[].highlightScores`       | float\[]        | Cosine similarity scores for each highlight.                 |
| `results[].summary`               | string          | LLM summary (if `summary` requested).                        |
| `results[].subpages`              | array           | Nested results from subpage crawling. Same shape as results. |
| `results[].extras.links`          | string\[]       | Extracted links from the page.                               |
| `statuses`                        | array           | Per-URL status information. Always check this for errors.    |
| `statuses[].id`                   | string          | The URL that was requested.                                  |
| `statuses[].status`               | string          | `"success"` or `"error"`.                                    |
| `statuses[].error.tag`            | string          | Error type (see Error Handling).                             |
| `statuses[].error.httpStatusCode` | integer or null | Corresponding HTTP status code.                              |
| `costDollars.total`               | float           | Total dollar cost for the request.                           |

## Error Handling

The endpoint returns HTTP 200 even when individual URLs fail. Per-URL errors appear in the `statuses` array.

### Per-URL Error Tags

| Tag                       | HTTP Code | Meaning                                |
| ------------------------- | --------- | -------------------------------------- |
| `CRAWL_NOT_FOUND`         | 404       | Content not found.                     |
| `CRAWL_TIMEOUT`           | 504       | Crawl timed out fetching content.      |
| `CRAWL_LIVECRAWL_TIMEOUT` | 504       | Livecrawl exceeded `livecrawlTimeout`. |
| `SOURCE_NOT_AVAILABLE`    | 403       | Access forbidden.                      |
| `UNSUPPORTED_URL`         | —         | URL type not supported.                |
| `CRAWL_UNKNOWN_ERROR`     | 500+      | Other errors.                          |

### Request-Level Errors

| HTTP Status | Meaning                           |
| ----------- | --------------------------------- |
| 400         | Bad request — invalid parameters. |
| 401         | Invalid or missing API key.       |
| 422         | Validation error.                 |
| 429         | Rate limit exceeded.              |

Always check `statuses` to handle per-URL failures:

```python theme={null}
result = exa.get_contents(["https://example.com", "https://example.com/maybe-broken"])
for status in result.statuses:
    if status.status == "error":
        print(f"Failed: {status.id} - {status.error.tag}")
```

## Common Mistakes

<Warning>
  LLMs frequently generate these incorrect parameters. Do NOT use any of the following:

  | Wrong                     | Correct                                                                                                                                            |
  | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `useAutoprompt: true`     | Remove it. `useAutoprompt` does **not exist** on the `/contents` endpoint.                                                                         |
  | `numSentences`            | Remove it. This highlights parameter is **deprecated**. Use `highlights: true` instead.                                                            |
  | `highlightsPerUrl`        | Remove it. This highlights parameter is **deprecated**. Use `highlights: true` instead.                                                            |
  | `livecrawl: "always"`     | Use `maxAgeHours: 0` instead. The `livecrawl` parameter is **deprecated**.                                                                         |
  | `tokensNum`               | Remove it. This parameter does **not exist**. Use `text.maxCharacters` to limit text length.                                                       |
  | `stream: true`            | Remove it. The `/contents` endpoint does **not** support streaming.                                                                                |
  | `contents: { text: ... }` | On `/contents`, `text`, `highlights`, and `summary` are **top-level** — do NOT wrap them in a `contents` object. This is different from `/search`. |

  **Remember:** On the `/contents` endpoint, `text`, `highlights`, and `summary` are top-level parameters. Do NOT nest them inside a `contents` object (that nesting is only for the `/search` endpoint).
</Warning>

## Patterns and Gotchas

* **Always check `statuses`.** The endpoint returns 200 even when individual URLs fail. Unchecked, you'll silently miss failed URLs.
* **Use `highlights` over `text` for agent workflows.** Highlights are 10x more token-efficient and return the most relevant excerpts.
* **Set `livecrawlTimeout` when using `maxAgeHours`.** Default is 10000ms. For slow sites, use 12000-15000ms.
* **`subpageTarget` focuses crawling.** Without it, subpage selection is best-effort. Use specific terms like `["api", "docs"]`.
* **Python SDK uses snake\_case.** `subpageTarget` → `subpage_target`, `maxAgeHours` → `max_age_hours`, `maxCharacters` → `max_characters`.
* **`urls` and `ids` are interchangeable.** Both accept URL strings. `ids` exists for backward compatibility with document IDs from search results.
* **Combine modes freely.** Request `text`, `highlights`, and `summary` in the same call for different views of the same content.

## Complete Examples

### Basic text extraction

```json theme={null}
{
  "urls": ["https://arxiv.org/abs/2301.07041"],
  "text": true
}
```

### Highlights with custom query

```json theme={null}
{
  "urls": ["https://example.com/research-paper"],
  "highlights": {
    "query": "methodology and results"
  }
}
```

### Documentation crawling

```json theme={null}
{
  "urls": ["https://platform.openai.com/docs"],
  "subpages": 15,
  "subpageTarget": ["api", "models", "embeddings"],
  "maxAgeHours": 24,
  "livecrawlTimeout": 15000,
  "text": {"maxCharacters": 5000}
}
```

### Structured company extraction

```json theme={null}
{
  "urls": ["https://stripe.com"],
  "subpages": 8,
  "subpageTarget": ["about", "careers", "press", "blog"],
  "summary": {
    "query": "Company overview, culture, and recent news",
    "schema": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "industry": {"type": "string"},
        "employee_count": {"type": "string"},
        "recent_news": {"type": "array", "items": {"type": "string"}}
      },
      "required": ["name", "industry"]
    }
  }
}
```
