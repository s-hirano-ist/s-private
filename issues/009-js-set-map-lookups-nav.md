# js-set-map-lookups: ナビゲーションコンポーネントでの非効率なルックアップ

## 概要
- **Rule**: `js-set-map-lookups`
- **Impact**: LOW-MEDIUM
- **Files**:
  - `app/src/components/common/layouts/nav/footer.tsx:98`
  - `app/src/components/common/layouts/nav/root-tab.tsx:75`

## 問題

`Footer`コンポーネントと`RootTab`コンポーネントで、`Object.keys(LAYOUTS).includes()`および`Object.keys(TABS).includes()`パターンを使用している。

`Object.keys().includes()`はO(n)の線形探索であり、配列を毎回生成する。`Set`を使用すればO(1)のルックアップが可能。

### 現在のコード（footer.tsx:98）

```typescript
const LAYOUTS = {
	dumper: "DUMPER",
	viewer: "VIEWER",
};

// ...

if (!Object.keys(LAYOUTS).includes(currentLayout)) {
	// ...
}
```

### 現在のコード（root-tab.tsx:75）

```typescript
const TABS = {
	articles: "ARTICLES",
	notes: "NOTES",
	images: "IMAGES",
	books: "BOOKS",
};

// ...

if (!Object.keys(TABS).includes(currentTab)) {
	// ...
}
```

## 解決策

`Set`を使用してO(1)のルックアップを実現する。オブジェクトのキーセットを事前に計算しておく。

### 修正後のコード（footer.tsx）

```typescript
const LAYOUTS = {
	dumper: "DUMPER",
	viewer: "VIEWER",
} as const;

const LAYOUT_KEYS = new Set(Object.keys(LAYOUTS));

// ...

if (!LAYOUT_KEYS.has(currentLayout)) {
	// ...
}
```

### 修正後のコード（root-tab.tsx）

```typescript
const TABS = {
	articles: "ARTICLES",
	notes: "NOTES",
	images: "IMAGES",
	books: "BOOKS",
} as const;

const TAB_KEYS = new Set(Object.keys(TABS));

// ...

if (!TAB_KEYS.has(currentTab)) {
	// ...
}
```

## 補足

現在のケースでは要素数が少ない（2〜4個）ため、パフォーマンスへの実際の影響は軽微。しかし、このパターンを一貫して使用することで:
1. コードの意図が明確になる（「このセットに含まれているか」という意図）
2. 将来的に要素数が増えた場合にも対応できる
3. 配列の毎回の生成を防げる

## 参考
- Vercel React Best Practices: `rules/js-set-map-lookups.md`
