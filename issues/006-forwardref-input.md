# Input: React 19 forwardRef マイグレーション

## 概要
`Input` コンポーネントが `React.forwardRef` を使用しているが、React 19 では `ref` を通常の props として受け取る形式が推奨される。

## 対象ファイル
- `packages/ui/ui/input.tsx` (Line 34-49)

## 現状のコード
```tsx
export type InputProps = {} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				className={cn(
					"flex h-9 w-full rounded-md border border-muted bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:font-medium file:text-base placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={ref}
				type={type}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";
```

## 問題点
- **違反ルール**: React 19 API Changes - forwardRef deprecation
- **理由**: React 19 では `forwardRef` は非推奨となり、`ref` を直接 props として受け取る形式が標準となった。

## 推奨される修正
```tsx
export type InputProps = {
	ref?: React.Ref<HTMLInputElement>;
} & React.InputHTMLAttributes<HTMLInputElement>;

function Input({ className, type, ref, ...props }: InputProps) {
	return (
		<input
			className={cn(
				"flex h-9 w-full rounded-md border border-muted bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:font-medium file:text-base placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			ref={ref}
			type={type}
			{...props}
		/>
	);
}
Input.displayName = "Input";

export { Input };
```

## メタ情報
- **Priority**: MEDIUM
- **Breaking Change**: No (APIは同じ)
- **作業量**: Small

## 参考リンク
- [React 19 Release Notes - ref as prop](https://react.dev/blog/2024/04/25/react-19)
