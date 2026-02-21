# Issue: Lightboxの遅延読み込み（~30-50KB 削減）

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance |
| **Priority** | MEDIUM |
| **Check Item** | クライアントバンドルサイズ削減 |
| **Affected File** | `app/src/components/common/display/image/image-stack.tsx` |

## Problem Description

`image-stack.tsx` で `yet-another-react-lightbox`（~30-50KB）が静的importされている。Lightboxはユーザーが画像をクリックした時のみ必要だが、画像タブの初期ロード時に全てバンドルされる。

### Current Code/Configuration

```typescript
// app/src/components/common/display/image/image-stack.tsx
"use client";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// ImageStack, EditableImageStack の両方で常にLightboxをレンダリング
<Lightbox
    close={() => setOpen(false)}
    index={index}
    open={open}
    slides={slides}
/>
```

## Recommendation

`next/dynamic` で遅延読み込みし、`open` 状態のときのみレンダリングする。

### Suggested Fix

```typescript
// app/src/components/common/display/image/image-stack.tsx
"use client";
import dynamic from "next/dynamic";

const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
    ssr: false,
});

// CSS importはLightboxコンポーネント内、または条件付きで読み込み

// ImageStack内:
{open && (
    <Lightbox
        close={() => setOpen(false)}
        index={index}
        open={open}
        slides={slides}
    />
)}

// EditableImageStack内も同様に条件付きレンダリング
```

## Implementation Steps

1. [ ] `image-stack.tsx` の静的importを `next/dynamic` に変更
2. [ ] `ImageStack` コンポーネントでLightboxを `open && ...` で条件付きレンダリング
3. [ ] `EditableImageStack` コンポーネントも同様に変更
4. [ ] CSS importの扱いを調整（Lightbox側に移動 or そのまま維持）
5. [ ] 動作確認（画像クリック時にLightboxが正常表示されることを確認）
