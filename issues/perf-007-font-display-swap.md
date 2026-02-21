# Issue: フォントの display: swap 追加

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance / UX |
| **Priority** | LOW |
| **Check Item** | Web Vitals (LCP/CLS) 改善 |
| **Affected File** | `app/src/app/layout.tsx` |

## Problem Description

`Noto_Sans_JP` フォントに `display: "swap"` が未設定。フォントのロード完了前にテキストが非表示（FOIT）になる可能性がある。

### Current Code/Configuration

```typescript
// app/src/app/layout.tsx (line 15)
const notoSansJp = Noto_Sans_JP({ subsets: ["latin"] });
```

## Recommendation

`display: "swap"` を追加し、フォントロード前にフォールバックフォントでテキストを即時表示する。

### Suggested Fix

```typescript
const notoSansJp = Noto_Sans_JP({
    subsets: ["latin"],
    display: "swap",
});
```

> 注: Next.jsの Google Fonts では `Noto_Sans_JP` に対して自動的にunicode-rangeベースのサブセット化が行われるため、`subsets: ["latin"]` でも日本語文字は利用可能。`display: "swap"` 追加はフォント読み込み中のUX改善のみ。

## Implementation Steps

1. [ ] `app/src/app/layout.tsx` の `Noto_Sans_JP` 設定に `display: "swap"` を追加
2. [ ] 動作確認
