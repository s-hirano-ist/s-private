# Tabs: React 19 forwardRef マイグレーション (3コンポーネント)

## 概要
`Tabs` 関連コンポーネント群が `React.forwardRef` を使用しているが、React 19 では `ref` を通常の props として受け取る形式が推奨される。

## 対象ファイル
- `packages/ui/ui/tabs.tsx` (Line 42-103)

## 対象コンポーネント (3個)
1. `TabsList` (Line 42-55)
2. `TabsTrigger` (Line 66-79)
3. `TabsContent` (Line 90-103)

## 現状のコード
```tsx
const TabsList = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.List
		className={cn(
			"inline-flex h-9 items-center justify-center rounded-lg p-1 text-muted-foreground",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Trigger
		className={cn(
			"inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 font-medium text-primary text-sm ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-linear-to-r data-[state=active]:from-primary data-[state=active]:to-primary-grad data-[state=active]:text-white",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		className={cn(
			"mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
```

## 問題点
- **違反ルール**: React 19 API Changes - forwardRef deprecation
- **理由**: React 19 では `forwardRef` は非推奨となり、`ref` を直接 props として受け取る形式が標準となった。

## 推奨される修正
```tsx
type TabsListProps = {
	ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.List>>;
} & React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>;

function TabsList({ className, ref, ...props }: TabsListProps) {
	return (
		<TabsPrimitive.List
			className={cn(
				"inline-flex h-9 items-center justify-center rounded-lg p-1 text-muted-foreground",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
TabsList.displayName = TabsPrimitive.List.displayName;

type TabsTriggerProps = {
	ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Trigger>>;
} & React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;

function TabsTrigger({ className, ref, ...props }: TabsTriggerProps) {
	return (
		<TabsPrimitive.Trigger
			className={cn(
				"inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 font-medium text-primary text-sm ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-linear-to-r data-[state=active]:from-primary data-[state=active]:to-primary-grad data-[state=active]:text-white",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

type TabsContentProps = {
	ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Content>>;
} & React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

function TabsContent({ className, ref, ...props }: TabsContentProps) {
	return (
		<TabsPrimitive.Content
			className={cn(
				"mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

## メタ情報
- **Priority**: MEDIUM
- **Breaking Change**: No (APIは同じ)
- **作業量**: Small (3コンポーネント)

## 参考リンク
- [React 19 Release Notes - ref as prop](https://react.dev/blog/2024/04/25/react-19)
