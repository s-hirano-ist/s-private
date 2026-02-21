# Issue: link-card.tsxからreact-markdownを除去（~50KB 削減）

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance |
| **Priority** | HIGH |
| **Check Item** | クライアントバンドルサイズ削減 |
| **Affected File** | `app/src/components/common/layouts/cards/link-card.tsx` |

## Problem Description

`link-card.tsx` は `"use client"` コンポーネントで `react-markdown`（~50KB）を静的importしている。このコンポーネントはDumperページの全カード（articles, notes）で使用されるため、全ページで react-markdown がクライアントバンドルに含まれる。

用途はカードの `description` フィールドの表示のみで、`line-clamp-3`（3行切り詰め）されるため、フルMarkdownパーサーは過剰。

### Current Code/Configuration

```typescript
// app/src/components/common/layouts/cards/link-card.tsx
"use client";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

// ...
<CardDescription className="line-clamp-3 break-words">
    {description ? (
        <ReactMarkdown components={markdownComponents}>
            {description}
        </ReactMarkdown>
    ) : ("　")}
</CardDescription>
```

> 注: `packages/ui/layouts/body/viewer-body.tsx` の react-markdown / react-syntax-highlighter はサーバーコンポーネント（async関数、`"use client"` なし）のため、クライアントバンドルには影響しない。

## Recommendation

`ReactMarkdown` を削除し、プレーンテキストとして表示する。descriptionにMarkdown記法は含まれないことを確認済み。

### Suggested Fix

```typescript
// app/src/components/common/layouts/cards/link-card.tsx
"use client";
import { Badge } from "@s-hirano-ist/s-ui/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@s-hirano-ist/s-ui/ui/card";
import type { ReactNode } from "react";
// react-markdown の import を削除
import { validateAndNormalizeUrl } from "@/components/common/utils/validate-url";
import { Link } from "@/infrastructures/i18n/routing";
import type { LinkCardData } from "./types";

// markdownComponents の定義を削除

// ...
<CardDescription className="line-clamp-3 break-words">
    {description || "　"}
</CardDescription>
```

## Implementation Steps

1. [ ] `link-card.tsx` から `react-markdown` のimportを削除
2. [ ] `markdownComponents` の定義を削除
3. [ ] `ReactMarkdown` をプレーンテキスト表示に置換
4. [ ] ビルド・動作確認（カード表示が正常であることを確認）
