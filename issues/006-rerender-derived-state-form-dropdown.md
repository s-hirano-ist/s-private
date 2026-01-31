# rerender-derived-state-no-effect: ドロップダウン入力でのprops→state同期

## 概要
- **Rule**: `rerender-derived-state-no-effect`
- **Impact**: MEDIUM
- **File**: `packages/ui/forms/fields/form-dropdown-input.tsx`
- **Lines**: 103-113

## 問題

`FormDropdownInput`コンポーネントで、2つの`useEffect`を使用してpropsからstateへの同期を行っている:

1. `preservedValue`から`value`への同期（103-107行目）
2. `value`から`inputRef.current.value`への同期（109-113行目）

これらはReactのアンチパターンであり、不要な再レンダリングとタイミング問題を引き起こす可能性がある。

### 現在のコード

```typescript
const [value, setValue] = useState("");

const formValues = useFormValues();
const preservedValue = formValues[name || htmlFor];

useEffect(() => {
	if (preservedValue) {
		setValue(preservedValue);
	}
}, [preservedValue]);

useEffect(() => {
	if (inputRef?.current) {
		inputRef.current.value = value;
	}
}, [value, inputRef]);
```

## 解決策

### 問題1: preservedValue → value の同期

レンダー中に導出するか、前の値との比較を使用する:

```typescript
const [value, setValue] = useState("");
const [prevPreservedValue, setPrevPreservedValue] = useState<string | undefined>(undefined);

// レンダー中に同期
if (preservedValue !== prevPreservedValue) {
	setPrevPreservedValue(preservedValue);
	if (preservedValue) {
		setValue(preservedValue);
	}
}
```

### 問題2: inputRef への値の同期

制御コンポーネントとしてrefを使わずに、または副作用を排除する:

```typescript
// hidden inputのvalueをstateから直接バインド
<input
	id={htmlFor}
	name={name || htmlFor}
	ref={inputRef}
	required={required}
	type="hidden"
	value={value}
	readOnly
/>
```

これにより、`useEffect`を使わずにReactの通常のレンダリングフローで値が同期される。

### 統合された修正後のコード

```typescript
const [value, setValue] = useState(preservedValue ?? "");
const [prevPreservedValue, setPrevPreservedValue] = useState(preservedValue);

if (preservedValue !== prevPreservedValue) {
	setPrevPreservedValue(preservedValue);
	if (preservedValue !== undefined) {
		setValue(preservedValue);
	}
}

// inputRefへの同期は削除し、JSXで直接valueをバインド
```

## 参考
- Vercel React Best Practices: `rules/rerender-derived-state-no-effect.md`
- React Docs: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
