# LinkCard: Boolean Props の Composition Pattern 違反

## 概要
`LinkCard` コンポーネントが `showDeleteButton` というboolean propsを使用しており、Vercel Composition Patternsの推奨パターンに反している。

## 対象ファイル
- `app/src/components/common/layouts/cards/link-card.tsx` (Line 19, 25, 59)

## 現状のコード
```tsx
type Props = {
	data: LinkCardData;
	showDeleteButton: boolean;
	deleteAction?: DeleteAction;
};

export function LinkCard({
	data: { id, title, description, primaryBadgeText, secondaryBadgeText, href },
	showDeleteButton,
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
- **理由**: Boolean propsは条件分岐を増やし、コンポーネントの責務を曖昧にする。`ImageCard`と同じパターンの問題が存在する。

## 推奨される修正
```tsx
type Props = {
	data: LinkCardData;
	actions?: ReactNode;
};

export function LinkCard({
	data: { id, title, description, primaryBadgeText, secondaryBadgeText, href },
	actions,
}: Props) {
	const { url: validatedHref, isExternal } = validateAndNormalizeUrl(href);

	const CardComponent = isExternal ? "a" : Link;
	const linkProps = isExternal
		? { href: validatedHref, rel: "noopener noreferrer", target: "_blank" }
		: { href: validatedHref };

	return (
		<div className="relative h-full">
			<CardComponent {...linkProps} className="block h-full">
				<Card className="flex h-full flex-col hover:bg-muted">
					{/* ... */}
				</Card>
			</CardComponent>
			{actions}
		</div>
	);
}

// 使用例
<LinkCard
	data={data}
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
- `ImageCard`と同時に修正することで、一貫性のあるAPIを維持可能
