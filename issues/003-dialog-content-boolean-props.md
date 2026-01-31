# DialogContent: Boolean Props の Composition Pattern 違反

## 概要
`DialogContent` コンポーネントが `fullWidth` というboolean propsを使用しており、Vercel Composition Patternsの推奨パターンに反している。

## 対象ファイル
- `packages/ui/ui/dialog.tsx` (Line 88-109)

## 現状のコード
```tsx
const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
		fullWidth?: boolean;
	}
>(({ className, children, fullWidth = false, ...props }, ref) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogPrimitive.Content
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ... max-w-4xl ...",
				!fullWidth && "max-w-lg",
				className,
			)}
			ref={ref}
			{...props}
		>
			{children}
		</DialogPrimitive.Content>
	</DialogPortal>
));
```

## 問題点
- **違反ルール**: Boolean Props Anti-pattern
- **理由**: Boolean propsはコンポーネントのバリエーションを制限する。将来的に `mediumWidth`, `narrowWidth` などの要件が出た場合、boolean propsの追加が必要になり、APIが複雑化する。

## 推奨される修正

### オプション1: Variant Pattern (推奨)
```tsx
const dialogContentVariants = cva(
	"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ... z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 ...",
	{
		variants: {
			size: {
				default: "max-w-lg",
				md: "max-w-2xl",
				lg: "max-w-4xl",
				full: "max-w-4xl", // or max-w-full
			},
		},
		defaultVariants: {
			size: "default",
		},
	}
);

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
		VariantProps<typeof dialogContentVariants>
>(({ className, children, size, ...props }, ref) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogPrimitive.Content
			className={cn(dialogContentVariants({ size }), className)}
			ref={ref}
			{...props}
		>
			{children}
		</DialogPrimitive.Content>
	</DialogPortal>
));
```

### オプション2: className による制御
```tsx
// fullWidth propを削除し、classNameで制御
<DialogContent className="max-w-4xl">
	{/* ... */}
</DialogContent>
```

## メタ情報
- **Priority**: HIGH
- **Breaking Change**: Yes
- **作業量**: Small

## 参考リンク
- [Vercel Composition Patterns - Variant Pattern](https://vercel.com/blog/how-to-write-composable-react-components)
- class-variance-authority を使用した Variant Pattern は shadcn/ui でも標準的に採用されている
