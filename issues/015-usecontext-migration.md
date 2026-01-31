# GenericFormWrapper: React 19 useContext マイグレーション

## 概要
`GenericFormWrapper` コンポーネントが `useContext` を使用しているが、React 19 では `use()` API が推奨される。

## 対象ファイル
- `packages/ui/forms/generic-form-wrapper.tsx` (Line 6, 39)

## 現状のコード
```tsx
import {
	createContext,
	type ReactNode,
	useActionState,
	useContext,
	useEffect,
	useState,
} from "react";

const FormValuesContext = createContext<Record<string, string>>({});

export const useFormValues = () => useContext(FormValuesContext);
```

## 問題点
- **違反ルール**: React 19 API Changes - useContext to use()
- **理由**: React 19 では `use()` API が導入され、`useContext` よりも柔軟にコンテキストを使用できる。`use()` は条件分岐内でも使用可能であり、Suspense との統合も改善されている。

## 推奨される修正
```tsx
import {
	createContext,
	type ReactNode,
	use,
	useActionState,
	useEffect,
	useState,
} from "react";

const FormValuesContext = createContext<Record<string, string>>({});

/**
 * Hook to access form values from the GenericFormWrapper context.
 *
 * @remarks
 * Use this hook in form field components to access preserved form values
 * when a form submission fails and values need to be restored.
 *
 * @returns Record of field names to their preserved values
 *
 * @example
 * ```tsx
 * function MyFormField({ name }) {
 *   const formValues = useFormValues();
 *   const preservedValue = formValues[name];
 *   return <input defaultValue={preservedValue} name={name} />;
 * }
 * ```
 *
 * @see {@link GenericFormWrapper} for the provider component
 */
export const useFormValues = () => use(FormValuesContext);
```

## メタ情報
- **Priority**: MEDIUM
- **Breaking Change**: No (APIは同じ)
- **作業量**: Small

## 注意事項
- `use()` は React 19 の新機能であり、React 18 以前では使用不可
- `use()` は条件分岐やループ内で使用可能だが、`useFormValues` のような単純なラッパーでは機能的な違いはほぼない
- 将来的なコードベースの一貫性のために移行を推奨

## 参考リンク
- [React 19 Release Notes - use() API](https://react.dev/blog/2024/04/25/react-19)
- [React use() Documentation](https://react.dev/reference/react/use)
