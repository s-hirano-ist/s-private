# Issue: Footer内Search Drawerの遅延読み込み（~20-30KB 削減）

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance |
| **Priority** | MEDIUM |
| **Check Item** | クライアントバンドルサイズ削減 |
| **Affected File** | `app/src/components/common/layouts/nav/footer.tsx` |

## Problem Description

`footer.tsx` は `"use client"` コンポーネントで全ページのlocaleレイアウトから読み込まれる。Drawer（`@base-ui/react/drawer` 経由）と SearchCard が検索ボタンを押す前からバンドルに含まれている。

### Current Code/Configuration

```typescript
// app/src/components/common/layouts/nav/footer.tsx
"use client";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@s-hirano-ist/s-ui/ui/drawer";
import { SearchCard } from "../../features/search/search-card";

// ...
<Drawer onOpenChange={setOpen} open={open}>
    <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="sr-only">
            <DrawerTitle>Search</DrawerTitle>
        </DrawerHeader>
        <SearchCard search={search} />
    </DrawerContent>
</Drawer>
```

## Recommendation

Drawer + SearchCard 部分を別コンポーネントに分離し、`next/dynamic` で遅延読み込みする。

### Suggested Fix

新規ファイル `app/src/components/common/layouts/nav/search-drawer.tsx` を作成:

```typescript
"use client";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@s-hirano-ist/s-ui/ui/drawer";
import { SearchCard } from "../../features/search/search-card";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    search: typeof searchContentFromClient;
};

export function SearchDrawer({ open, onOpenChange, search }: Props) {
    return (
        <Drawer onOpenChange={onOpenChange} open={open}>
            <DrawerContent className="max-h-[80vh]">
                <DrawerHeader className="sr-only">
                    <DrawerTitle>Search</DrawerTitle>
                </DrawerHeader>
                <SearchCard search={search} />
            </DrawerContent>
        </Drawer>
    );
}
```

`footer.tsx` を更新:

```typescript
import dynamic from "next/dynamic";

const SearchDrawer = dynamic(
    () => import("./search-drawer").then(mod => mod.SearchDrawer),
    { ssr: false }
);

// ...
{open && <SearchDrawer open={open} onOpenChange={setOpen} search={search} />}
```

## Implementation Steps

1. [ ] `search-drawer.tsx` を新規作成（Drawer + SearchCard を移動）
2. [ ] `footer.tsx` から Drawer 関連のimportを削除
3. [ ] `footer.tsx` で `next/dynamic` を使って SearchDrawer を遅延読み込み
4. [ ] `open` 状態の条件付きレンダリングに変更
5. [ ] 動作確認（検索ボタンクリック時にDrawerが正常動作することを確認）
