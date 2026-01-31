# DropdownMenu: React 19 forwardRef マイグレーション (5コンポーネント)

## 概要
`DropdownMenu` 関連コンポーネント群が `React.forwardRef` を使用しているが、React 19 では `ref` を通常の props として受け取る形式が推奨される。

## 対象ファイル
- `packages/ui/ui/dropdown-menu.tsx` (Line 71-177)

## 対象コンポーネント (5個)
1. `DropdownMenuSubContent` (Line 71-85)
2. `DropdownMenuContent` (Line 96-113)
3. `DropdownMenuItem` (Line 123-139)
4. `DropdownMenuLabel` (Line 146-162)
5. `DropdownMenuSeparator` (Line 167-177)

## 現状のコード
```tsx
const DropdownMenuSubContent = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
	<DropdownMenuPrimitive.SubContent
		className={cn(/* ... */, className)}
		ref={ref}
		{...props}
	/>
));

const DropdownMenuContent = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
	<DropdownMenuPrimitive.Portal>
		<DropdownMenuPrimitive.Content
			className={cn(/* ... */, className)}
			ref={ref}
			sideOffset={sideOffset}
			{...props}
		/>
	</DropdownMenuPrimitive.Portal>
));

const DropdownMenuItem = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<DropdownMenuPrimitive.Item
		className={cn(/* ... */, inset && "pl-8", className)}
		ref={ref}
		{...props}
	/>
));

// ... DropdownMenuLabel, DropdownMenuSeparator も同様
```

## 問題点
- **違反ルール**: React 19 API Changes - forwardRef deprecation
- **理由**: React 19 では `forwardRef` は非推奨となり、`ref` を直接 props として受け取る形式が標準となった。

## 推奨される修正
```tsx
type DropdownMenuSubContentProps = {
	ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.SubContent>>;
} & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>;

function DropdownMenuSubContent({
	className,
	ref,
	...props
}: DropdownMenuSubContentProps) {
	return (
		<DropdownMenuPrimitive.SubContent
			className={cn(/* ... */, className)}
			ref={ref}
			{...props}
		/>
	);
}
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

type DropdownMenuContentProps = {
	ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Content>>;
} & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>;

function DropdownMenuContent({
	className,
	sideOffset = 4,
	ref,
	...props
}: DropdownMenuContentProps) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				className={cn(/* ... */, className)}
				ref={ref}
				sideOffset={sideOffset}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

type DropdownMenuItemProps = {
	ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Item>>;
	inset?: boolean;
} & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>;

function DropdownMenuItem({
	className,
	inset,
	ref,
	...props
}: DropdownMenuItemProps) {
	return (
		<DropdownMenuPrimitive.Item
			className={cn(
				"relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors focus:bg-primary focus:text-primary-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
				inset && "pl-8",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

type DropdownMenuLabelProps = {
	ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Label>>;
	inset?: boolean;
} & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>;

function DropdownMenuLabel({
	className,
	inset,
	ref,
	...props
}: DropdownMenuLabelProps) {
	return (
		<DropdownMenuPrimitive.Label
			className={cn(
				"px-2 py-1.5 font-semibold text-sm",
				inset && "pl-8",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

type DropdownMenuSeparatorProps = {
	ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Separator>>;
} & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>;

function DropdownMenuSeparator({
	className,
	ref,
	...props
}: DropdownMenuSeparatorProps) {
	return (
		<DropdownMenuPrimitive.Separator
			className={cn("-mx-1 my-1 h-px bg-muted", className)}
			ref={ref}
			{...props}
		/>
	);
}
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
```

## メタ情報
- **Priority**: MEDIUM
- **Breaking Change**: No (APIは同じ)
- **作業量**: Medium (5コンポーネント)

## 参考リンク
- [React 19 Release Notes - ref as prop](https://react.dev/blog/2024/04/25/react-19)
