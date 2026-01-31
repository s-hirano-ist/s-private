# rerender-derived-state-no-effect: フォームラッパーでのprops→state同期

## 概要
- **Rule**: `rerender-derived-state-no-effect`
- **Impact**: MEDIUM
- **File**: `packages/ui/forms/generic-form-wrapper.tsx`
- **Lines**: 112-116

## 問題

`GenericFormWrapper`コンポーネントで、`useEffect`を使用して`preservedValues` propsから`formValues` stateへの同期を行っている。これはReactのアンチパターンであり、不要な再レンダリングを引き起こす。

propsからstateを派生させるパターンは、useEffectではなくレンダー中に直接行うか、コンポーネントをキーで制御すべき。

### 現在のコード

```typescript
const [formValues, setFormValues] = useState<Record<string, string>>(
	preservedValues || {},
);

useEffect(() => {
	if (preservedValues) {
		setFormValues(preservedValues);
	}
}, [preservedValues]);
```

## 解決策

### オプション1: レンダー中に導出（推奨）

```typescript
const [internalFormValues, setInternalFormValues] = useState<Record<string, string>>({});

// preservedValuesがある場合はそれを使用、なければ内部状態を使用
const formValues = preservedValues ?? internalFormValues;
```

### オプション2: キーによる制御

親コンポーネントで`key`を使用してリセットする:

```tsx
<GenericFormWrapper
	key={preservedValuesKey}
	preservedValues={preservedValues}
	// ...
/>
```

### オプション3: 前の値との比較（状態が必要な場合）

```typescript
const [formValues, setFormValues] = useState<Record<string, string>>(
	preservedValues || {},
);
const [prevPreservedValues, setPrevPreservedValues] = useState(preservedValues);

if (preservedValues !== prevPreservedValues) {
	setPrevPreservedValues(preservedValues);
	if (preservedValues) {
		setFormValues(preservedValues);
	}
}
```

## 参考
- Vercel React Best Practices: `rules/rerender-derived-state-no-effect.md`
- React Docs: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
