# Issue: ルートレイアウトにメタデータが設定されていない

## Metadata

| Field | Value |
|-------|-------|
| **Category** | SEO-OGP |
| **Priority** | MEDIUM |
| **Check Item** | titleタグ |
| **Affected File** | `app/src/app/layout.tsx` |

## Problem Description

ルートレイアウト（`app/src/app/layout.tsx`）にNext.jsのMetadata APIによるメタデータ設定がありません。これにより、子レイアウトでメタデータが設定されていないページでは、titleやdescriptionが空になります。

### Current Code/Configuration

```tsx
// app/src/app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Noto_Sans_JP } from "next/font/google";
import { env } from "@/env";

const notoSansJp = Noto_Sans_JP({ subsets: ["latin"] });

export default function RootLayout({
    children,
}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="ja" suppressHydrationWarning>
            {/* ... */}
        </html>
    );
}
// metadataエクスポートなし
```

### Issues

1. 認証前のページ（ログイン画面など）でtitleが設定されない
2. エラーページ（error.tsx、not-found.tsx）でtitleが空
3. メタデータの継承元がないため、子レイアウトで個別に全て設定する必要がある

## Recommendation

ルートレイアウトにデフォルトのメタデータを設定し、子レイアウトで上書きできるようにします。

### Suggested Fix

```tsx
// app/src/app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Noto_Sans_JP } from "next/font/google";
import { env } from "@/env";

const notoSansJp = Noto_Sans_JP({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: {
        default: "s-private",
        template: "%s | s-private",
    },
    description: "Dumper and Viewer of s-hirano-ist's memories.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function RootLayout({
    children,
}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="ja" suppressHydrationWarning>
            {/* ... */}
        </html>
    );
}
```

## Implementation Steps

1. [ ] `app/src/app/layout.tsx`にMetadata型をインポート
2. [ ] `metadata`オブジェクトをエクスポート
3. [ ] `title.template`を設定して子ページでの上書きを容易に
4. [ ] `robots`でnoindex/nofollowを設定（プライベートアプリのため）
5. [ ] 各子レイアウト・ページのメタデータを確認・更新

## References

- https://zenn.dev/catnose99/articles/547cbf57e5ad28
- https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- https://nextjs.org/docs/app/building-your-application/optimizing/metadata
