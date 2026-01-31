# rerender-memo-with-default-value: ドロップダウン入力の関数デフォルト値

## 概要
- **Rule**: `rerender-memo-with-default-value`
- **Impact**: MEDIUM
- **File**: `packages/ui/forms/fields/form-dropdown-input.tsx`
- **Lines**: 92-94

## 問題

`FormDropdownInput`コンポーネントで、`customValueLabel`のデフォルト値がインラインのアロー関数として定義されている。

インラインの関数は毎回新しい参照を生成するため、親コンポーネントが再レンダリングするたびに新しい関数が作成される。これは、このコンポーネントがmemoされていなくても、子コンポーネントや他の最適化に影響を与える可能性がある。

### 現在のコード

```typescript
export function FormDropdownInput({
	label,
	htmlFor,
	options,
	inputRef,
	placeholder,
	name,
	required,
	disabled,
	emptyMessage = "No results found",
	searchPlaceholder = "Search...",
	customValueLabel = (v) => `Use "${v}"`,
}: Props) {
```

## 解決策

デフォルト値をコンポーネント外部で定数として定義する。これにより、関数の参照が安定し、不要な再計算を防げる。

### 修正後のコード

```typescript
const DEFAULT_EMPTY_MESSAGE = "No results found";
const DEFAULT_SEARCH_PLACEHOLDER = "Search...";
const DEFAULT_CUSTOM_VALUE_LABEL = (v: string) => `Use "${v}"`;

export function FormDropdownInput({
	label,
	htmlFor,
	options,
	inputRef,
	placeholder,
	name,
	required,
	disabled,
	emptyMessage = DEFAULT_EMPTY_MESSAGE,
	searchPlaceholder = DEFAULT_SEARCH_PLACEHOLDER,
	customValueLabel = DEFAULT_CUSTOM_VALUE_LABEL,
}: Props) {
```

## 参考
- Vercel React Best Practices: `rules/rerender-memo-with-default-value.md`
