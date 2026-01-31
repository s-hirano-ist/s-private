# Button: React 19 forwardRef マイグレーション

## 概要
`Button` コンポーネントが `React.forwardRef` を使用しているが、React 19 では `ref` を通常の props として受け取る形式が推奨される。

## 対象ファイル
- `packages/ui/ui/button.tsx` (Line 102-114)

## 現状のコード
```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? SlotPrimitive.Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";
```

## 問題点
- **違反ルール**: React 19 API Changes - forwardRef deprecation
- **理由**: React 19 では `forwardRef` は非推奨となり、`ref` を直接 props として受け取る形式が標準となった。これによりコードがシンプルになり、TypeScript の型推論も改善される。

## 推奨される修正
```tsx
export type ButtonProps = {
	/** Render as child element using Radix Slot */
	asChild?: boolean;
	/** Forwarded ref */
	ref?: React.Ref<HTMLButtonElement>;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

function Button({
	className,
	variant,
	size,
	asChild = false,
	ref,
	...props
}: ButtonProps) {
	const Comp = asChild ? SlotPrimitive.Slot : "button";
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			ref={ref}
			{...props}
		/>
	);
}
Button.displayName = "Button";

export { Button, buttonVariants };
```

## メタ情報
- **Priority**: MEDIUM
- **Breaking Change**: No (APIは同じ)
- **作業量**: Small

## 参考リンク
- [React 19 Release Notes - ref as prop](https://react.dev/blog/2024/04/25/react-19)
- `displayName` は DevTools のデバッグ用に維持することを推奨
