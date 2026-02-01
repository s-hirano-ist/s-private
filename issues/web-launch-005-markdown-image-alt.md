# Issue: ReactMarkdownコンポーネントで画像のalt属性カスタマイズが未実装

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Accessibility-Performance |
| **Priority** | MEDIUM |
| **Check Item** | 画像alt属性 |
| **Affected File** | `packages/ui/layouts/body/viewer-body.tsx`, `app/src/components/common/layouts/cards/link-card.tsx` |

## Problem Description

ReactMarkdownコンポーネントで`img`要素のカスタマイズが行われておらず、Markdownソース内で`![](url)`のようにaltテキストなしで記載された画像は、空のalt属性でレンダリングされます。これはアクセシビリティ上の問題となります。

### Current Code/Configuration

```tsx
// packages/ui/layouts/body/viewer-body.tsx - lines 88-89
<ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
    {markdown}
</ReactMarkdown>
// componentsオブジェクトにimgのカスタマイズなし
```

```tsx
// app/src/components/common/layouts/cards/link-card.tsx - line 48
<ReactMarkdown>{description}</ReactMarkdown>
// componentsプロパティなし
```

### Issues

1. alt属性が空の画像はスクリーンリーダーで正しく読み上げられない
2. アクセシビリティ監査で警告が発生する
3. SEO観点でも画像にaltテキストがあることが推奨される

## Recommendation

ReactMarkdownの`components`プロパティで`img`要素をカスタマイズし、altが空の場合にフォールバックテキストを提供するか、装飾画像として`role="presentation"`を設定します。

### Suggested Fix

```tsx
// packages/ui/layouts/body/viewer-body.tsx
const components: Components = {
    // ... 既存のコンポーネント
    img: ({ src, alt, ...props }) => {
        // altが空の場合は装飾画像として扱う
        if (!alt) {
            return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt=""
                    role="presentation"
                    {...props}
                />
            );
        }
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} {...props} />
        );
    },
    // ... 他のコンポーネント
};
```

```tsx
// app/src/components/common/layouts/cards/link-card.tsx
const markdownComponents = {
    img: ({ src, alt, ...props }) => {
        if (!alt) {
            return (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" role="presentation" {...props} />
            );
        }
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} {...props} />
        );
    },
};

// 使用箇所
<ReactMarkdown components={markdownComponents}>{description}</ReactMarkdown>
```

## Implementation Steps

1. [ ] `packages/ui/layouts/body/viewer-body.tsx`のcomponentsに`img`を追加
2. [ ] `app/src/components/common/layouts/cards/link-card.tsx`にcomponents追加
3. [ ] 共通のimg処理を抽出してユーティリティ化を検討
4. [ ] アクセシビリティテスト（axe-coreなど）で確認

## References

- https://zenn.dev/catnose99/articles/547cbf57e5ad28
- https://www.w3.org/WAI/tutorials/images/
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/presentation_role
