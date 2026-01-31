# Dialog: React 19 forwardRef マイグレーション (4コンポーネント)

## 概要
`Dialog` 関連コンポーネント群が `React.forwardRef` を使用しているが、React 19 では `ref` を通常の props として受け取る形式が推奨される。

## 対象ファイル
- `packages/ui/ui/dialog.tsx` (Line 59-197)

## 対象コンポーネント (4個)
1. `DialogOverlay` (Line 59-72)
2. `DialogContent` (Line 88-109)
3. `DialogTitle` (Line 164-177)
4. `DialogDescription` (Line 187-197)

## 現状のコード
```tsx
const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
		fullWidth?: boolean;
	}
>(({ className, children, fullWidth = false, ...props }, ref) => (
	// ...
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// ... DialogTitle, DialogDescription も同様
```

## 問題点
- **違反ルール**: React 19 API Changes - forwardRef deprecation
- **理由**: React 19 では `forwardRef` は非推奨となり、`ref` を直接 props として受け取る形式が標準となった。

## 推奨される修正
```tsx
type DialogOverlayProps = {
	ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Overlay>>;
} & React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>;

function DialogOverlay({ className, ref, ...props }: DialogOverlayProps) {
	return (
		<DialogPrimitive.Overlay
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentProps = {
	ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Content>>;
	fullWidth?: boolean;
} & React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;

function DialogContent({
	className,
	children,
	fullWidth = false,
	ref,
	...props
}: DialogContentProps) {
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Content
				className={cn(
					"data-[state=closed]:fade-out-0 ...",
					!fullWidth && "max-w-lg",
					className,
				)}
				ref={ref}
				{...props}
			>
				{children}
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}
DialogContent.displayName = DialogPrimitive.Content.displayName;

type DialogTitleProps = {
	ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Title>>;
} & React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;

function DialogTitle({ className, ref, ...props }: DialogTitleProps) {
	return (
		<DialogPrimitive.Title
			className={cn(
				"font-semibold text-lg leading-none tracking-tight",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
DialogTitle.displayName = DialogPrimitive.Title.displayName;

type DialogDescriptionProps = {
	ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Description>>;
} & React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;

function DialogDescription({ className, ref, ...props }: DialogDescriptionProps) {
	return (
		<DialogPrimitive.Description
			className={cn("text-muted-foreground text-sm", className)}
			ref={ref}
			{...props}
		/>
	);
}
DialogDescription.displayName = DialogPrimitive.Description.displayName;
```

## メタ情報
- **Priority**: MEDIUM
- **Breaking Change**: No (APIは同じ)
- **作業量**: Medium (4コンポーネント)

## 注意事項
- `DialogContent` の `fullWidth` boolean prop は別Issue (#003) で対応
- `DialogHeader` と `DialogFooter` は既に通常の関数コンポーネントとして実装済み

## 参考リンク
- [React 19 Release Notes - ref as prop](https://react.dev/blog/2024/04/25/react-19)
