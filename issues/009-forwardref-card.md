# Card: React 19 forwardRef マイグレーション (6コンポーネント)

## 概要
`Card` 関連コンポーネント群が `React.forwardRef` を使用しているが、React 19 では `ref` を通常の props として受け取る形式が推奨される。

## 対象ファイル
- `packages/ui/ui/card.tsx` (Line 36-151)

## 対象コンポーネント (6個)
1. `Card` (Line 36-49)
2. `CardHeader` (Line 61-71)
3. `CardTitle` (Line 81-94)
4. `CardDescription` (Line 104-114)
5. `CardContent` (Line 124-130)
6. `CardFooter` (Line 141-151)

## 現状のコード
```tsx
const Card = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		className={cn(
			"rounded-xl border border-muted bg-primary-foreground text-primary shadow-sm",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		className={cn("flex flex-col space-y-1.5 p-6", className)}
		ref={ref}
		{...props}
	/>
));
CardHeader.displayName = "CardHeader";

// ... CardTitle, CardDescription, CardContent, CardFooter も同様
```

## 問題点
- **違反ルール**: React 19 API Changes - forwardRef deprecation
- **理由**: React 19 では `forwardRef` は非推奨となり、`ref` を直接 props として受け取る形式が標準となった。

## 推奨される修正
```tsx
type CardProps = {
	ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>;

function Card({ className, ref, ...props }: CardProps) {
	return (
		<div
			className={cn(
				"rounded-xl border border-muted bg-primary-foreground text-primary shadow-sm",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
Card.displayName = "Card";

type CardHeaderProps = {
	ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>;

function CardHeader({ className, ref, ...props }: CardHeaderProps) {
	return (
		<div
			className={cn("flex flex-col space-y-1.5 p-6", className)}
			ref={ref}
			{...props}
		/>
	);
}
CardHeader.displayName = "CardHeader";

type CardTitleProps = {
	ref?: React.Ref<HTMLHeadingElement>;
} & React.HTMLAttributes<HTMLHeadingElement>;

function CardTitle({ className, ref, ...props }: CardTitleProps) {
	return (
		<h3
			className={cn(
				"bg-clip-text font-bold leading-normal tracking-tight",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
CardTitle.displayName = "CardTitle";

type CardDescriptionProps = {
	ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>;

function CardDescription({ className, ref, ...props }: CardDescriptionProps) {
	return (
		<div
			className={cn("text-muted-foreground text-sm", className)}
			ref={ref}
			{...props}
		/>
	);
}
CardDescription.displayName = "CardDescription";

type CardContentProps = {
	ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>;

function CardContent({ className, ref, ...props }: CardContentProps) {
	return <div className={cn("p-6 pt-0", className)} ref={ref} {...props} />;
}
CardContent.displayName = "CardContent";

type CardFooterProps = {
	ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>;

function CardFooter({ className, ref, ...props }: CardFooterProps) {
	return (
		<div
			className={cn("flex items-center p-6 pt-0", className)}
			ref={ref}
			{...props}
		/>
	);
}
CardFooter.displayName = "CardFooter";

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
};
```

## メタ情報
- **Priority**: MEDIUM
- **Breaking Change**: No (APIは同じ)
- **作業量**: Medium (6コンポーネント)

## 参考リンク
- [React 19 Release Notes - ref as prop](https://react.dev/blog/2024/04/25/react-19)
