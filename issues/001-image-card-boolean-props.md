# ImageCard: Boolean Props の Composition Pattern 違反

## 概要
`ImageCard` コンポーネントが `showDeleteButton` というboolean propsを使用しており、Vercel Composition Patternsの推奨パターンに反している。

## 対象ファイル
- `app/src/components/common/layouts/cards/image-card.tsx` (Line 13, 20, 45)

## 現状のコード
```tsx
type Props = {
	data: ImageCardData;
	basePath: string;
	showDeleteButton?: boolean;
	deleteAction?: DeleteAction;
};

export function ImageCard({
	basePath,
	data: { id, title, href, image },
	showDeleteButton = false,
	deleteAction,
}: Props) {
	return (
		<div className="relative h-full">
			{/* ... */}
			{showDeleteButton && deleteAction !== undefined && (
				<DeleteButtonWithModal
					deleteAction={deleteAction}
					id={id}
					title={title}
				/>
			)}
		</div>
	);
}
```

## 問題点
- **違反ルール**: Boolean Props Anti-pattern
- **理由**: Boolean propsは条件分岐を増やし、コンポーネントの責務を曖昧にする。Composition patternでは、機能を子コンポーネントとして渡すことで、より柔軟で再利用可能な設計が可能になる。

## 推奨される修正
```tsx
type Props = {
	data: ImageCardData;
	basePath: string;
	actions?: ReactNode;
};

export function ImageCard({
	basePath,
	data: { id, title, href, image },
	actions,
}: Props) {
	return (
		<div className="relative h-full">
			<Link className="block h-full" href={`/${basePath}/${href}` as Route}>
				<Card className="flex h-full flex-col hover:bg-muted">
					{/* ... */}
				</Card>
			</Link>
			{actions}
		</div>
	);
}

// 使用例
<ImageCard
	data={data}
	basePath={basePath}
	actions={
		<DeleteButtonWithModal
			deleteAction={deleteAction}
			id={data.id}
			title={data.title}
		/>
	}
/>
```

## メタ情報
- **Priority**: HIGH
- **Breaking Change**: Yes
- **作業量**: Medium

## 参考リンク
- [Vercel Composition Patterns - Boolean Props](https://vercel.com/blog/how-to-write-composable-react-components)
- 複数のboolean propsが蓄積すると、条件分岐が指数関数的に増加する
