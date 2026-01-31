# Label: React 19 forwardRef マイグレーション

## 概要
`Label` コンポーネントが `React.forwardRef` を使用しているが、React 19 では `ref` を通常の props として受け取る形式が推奨される。

## 対象ファイル
- `packages/ui/ui/label.tsx` (Line 33-44)

## 現状のコード
```tsx
const Label = React.forwardRef<
	React.ElementRef<typeof LabelPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
		VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
	<LabelPrimitive.Root
		className={cn(labelVariants(), className)}
		ref={ref}
		{...props}
	/>
));
Label.displayName = LabelPrimitive.Root.displayName;
```

## 問題点
- **違反ルール**: React 19 API Changes - forwardRef deprecation
- **理由**: React 19 では `forwardRef` は非推奨となり、`ref` を直接 props として受け取る形式が標準となった。

## 推奨される修正
```tsx
type LabelProps = {
	ref?: React.Ref<React.ElementRef<typeof LabelPrimitive.Root>>;
} & React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
	VariantProps<typeof labelVariants>;

function Label({ className, ref, ...props }: LabelProps) {
	return (
		<LabelPrimitive.Root
			className={cn(labelVariants(), className)}
			ref={ref}
			{...props}
		/>
	);
}
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

## メタ情報
- **Priority**: MEDIUM
- **Breaking Change**: No (APIは同じ)
- **作業量**: Small

## 参考リンク
- [React 19 Release Notes - ref as prop](https://react.dev/blog/2024/04/25/react-19)
