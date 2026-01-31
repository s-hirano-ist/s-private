# rerender-memo-with-default-value: memoコンポーネントのインラインデフォルト値

## 概要
- **Rule**: `rerender-memo-with-default-value`
- **Impact**: MEDIUM
- **File**: `app/src/components/common/lazy-tab-content.tsx`
- **Lines**: 17-22

## 問題

`LazyTabContentComponent`は`memo()`でラップされているが、`fallback`と`enablePreloading`のデフォルト値がインラインで定義されている。

インラインのデフォルト値（特にオブジェクト、配列、関数）は毎回新しい参照を生成するため、`memo()`の浅い比較が常にfalseを返し、メモ化の効果が無効化される可能性がある。

### 現在のコード

```typescript
function LazyTabContentComponent({
	tabName,
	children,
	fallback = null,
	enablePreloading = true,
}: Props) {
	// ...
}

export const LazyTabContent = memo(LazyTabContentComponent);
```

## 解決策

デフォルト値をコンポーネント外部で定数として定義する。プリミティブ値（`null`, `true`, `false`など）は参照比較でも問題ないが、一貫性のために外部定義することを推奨。

### 修正後のコード

```typescript
const DEFAULT_FALLBACK = null;
const DEFAULT_ENABLE_PRELOADING = true;

function LazyTabContentComponent({
	tabName,
	children,
	fallback = DEFAULT_FALLBACK,
	enablePreloading = DEFAULT_ENABLE_PRELOADING,
}: Props) {
	// ...
}

export const LazyTabContent = memo(LazyTabContentComponent);
```

### 注意

この場合、`fallback = null`と`enablePreloading = true`はプリミティブ値なので、実際にはメモ化に影響しない。しかし、将来的に`fallback`がReactNode（オブジェクト）に変更された場合に問題になる可能性があるため、予防的に外部定義しておくことが推奨される。

より重要なのは、`fallback`に`<Loading />`のようなJSXがデフォルトとして渡された場合で、その場合は毎回新しいReact要素が生成されるためメモ化が無効化される。

## 参考
- Vercel React Best Practices: `rules/rerender-memo-with-default-value.md`
