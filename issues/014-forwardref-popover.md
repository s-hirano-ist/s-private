# Popover: React 19 forwardRef マイグレーション (1コンポーネント)

## 概要
`PopoverContent` コンポーネントが `React.forwardRef` を使用しているが、React 19 では `ref` を通常の props として受け取る形式が推奨される。

## 対象ファイル
- `packages/ui/ui/popover.tsx` (Line 55-72)

## 対象コンポーネント (1個)
1. `PopoverContent` (Line 55-72)

## 現状のコード
```tsx
const PopoverContent = React.forwardRef<
	React.ElementRef<typeof PopoverPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
	<PopoverPrimitive.Portal>
		<PopoverPrimitive.Content
			align={align}
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md border bg-background p-4 text-foreground shadow-md outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in",
				className,
			)}
			ref={ref}
			sideOffset={sideOffset}
			{...props}
		/>
	</PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
```

## 問題点
- **違反ルール**: React 19 API Changes - forwardRef deprecation
- **理由**: React 19 では `forwardRef` は非推奨となり、`ref` を直接 props として受け取る形式が標準となった。

## 推奨される修正
```tsx
type PopoverContentProps = {
	ref?: React.Ref<React.ElementRef<typeof PopoverPrimitive.Content>>;
} & React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;

function PopoverContent({
	className,
	align = "center",
	sideOffset = 4,
	ref,
	...props
}: PopoverContentProps) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				align={align}
				className={cn(
					"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md border bg-background p-4 text-foreground shadow-md outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in",
					className,
				)}
				ref={ref}
				sideOffset={sideOffset}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
```

## メタ情報
- **Priority**: MEDIUM
- **Breaking Change**: No (APIは同じ)
- **作業量**: Small (1コンポーネント)

## 参考リンク
- [React 19 Release Notes - ref as prop](https://react.dev/blog/2024/04/25/react-19)
