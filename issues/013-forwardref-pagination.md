# Pagination: React 19 forwardRef マイグレーション (2コンポーネント)

## 概要
`Pagination` 関連コンポーネント群が `React.forwardRef` を使用しているが、React 19 では `ref` を通常の props として受け取る形式が推奨される。

## 対象ファイル
- `packages/ui/ui/pagination.tsx` (Line 70-100)

## 対象コンポーネント (2個)
1. `PaginationContent` (Line 70-82)
2. `PaginationItem` (Line 94-100)

## 現状のコード
```tsx
const PaginationContent = React.forwardRef<
	HTMLUListElement,
	React.ComponentProps<"ul">
>(function PaginationContent({ className, ...props }, ref) {
	return (
		<ul
			className={cn("flex flex-row items-center gap-1", className)}
			ref={ref}
			{...props}
		/>
	);
});
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
	HTMLLIElement,
	React.ComponentProps<"li">
>(function PaginationItem({ className, ...props }, ref) {
	return <li className={cn("", className)} ref={ref} {...props} />;
});
PaginationItem.displayName = "PaginationItem";
```

## 問題点
- **違反ルール**: React 19 API Changes - forwardRef deprecation
- **理由**: React 19 では `forwardRef` は非推奨となり、`ref` を直接 props として受け取る形式が標準となった。

## 推奨される修正
```tsx
type PaginationContentProps = {
	ref?: React.Ref<HTMLUListElement>;
} & React.ComponentProps<"ul">;

function PaginationContent({ className, ref, ...props }: PaginationContentProps) {
	return (
		<ul
			className={cn("flex flex-row items-center gap-1", className)}
			ref={ref}
			{...props}
		/>
	);
}
PaginationContent.displayName = "PaginationContent";

type PaginationItemProps = {
	ref?: React.Ref<HTMLLIElement>;
} & React.ComponentProps<"li">;

function PaginationItem({ className, ref, ...props }: PaginationItemProps) {
	return <li className={cn("", className)} ref={ref} {...props} />;
}
PaginationItem.displayName = "PaginationItem";
```

## メタ情報
- **Priority**: MEDIUM
- **Breaking Change**: No (APIは同じ)
- **作業量**: Small (2コンポーネント)

## 注意事項
- `Pagination`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis` は既に通常の関数コンポーネントとして実装済み

## 参考リンク
- [React 19 Release Notes - ref as prop](https://react.dev/blog/2024/04/25/react-19)
