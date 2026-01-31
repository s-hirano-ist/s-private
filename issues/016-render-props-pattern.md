# BaseCardStackWrapper: Render Props パターンの検討

## 概要
`BaseCardStackWrapper` コンポーネントが `renderCard` という render props パターンを使用している。これは Vercel Composition Patterns では非推奨とされることがあるが、このケースでは適切な使用である可能性が高い。

## 対象ファイル
- `app/src/components/common/layouts/cards/base-card-stack.tsx` (Line 14-27, 79-86)

## 現状のコード
```tsx
type BaseCardStackProps<T extends SearchableItem> = {
	initial: CardStackInitialData<T>;
	deleteAction?: DeleteAction;
	loadMoreAction: LoadMoreAction<CardStackInitialData<T>>;
	renderCard: (
		item: T,
		index: number,
		isLast: boolean,
		lastElementRef: (node: HTMLElement | null) => void,
		deleteAction?: DeleteAction,
		key?: string,
	) => React.ReactNode;
	gridClassName: string;
};

export function BaseCardStackWrapper<T extends SearchableItem>({
	initial,
	deleteAction,
	loadMoreAction,
	renderCard,
	gridClassName,
}: BaseCardStackProps<T>) {
	// ...
	return (
		<div className="px-2 py-4">
			{allData.length === 0 ? (
				<StatusCodeView statusCode="204" statusCodeString={t("204")} />
			) : (
				<div className={gridClassName}>
					{allData.map((item, index) => {
						const isLast = index === allData.length - 1;
						const itemKey = "key" in item ? item.key : item.id;
						return renderCard(
							item,
							index,
							isLast,
							lastElementRef,
							deleteAction,
							itemKey,
						);
					})}
				</div>
			)}
			{isPending && <Loading />}
		</div>
	);
}
```

## 問題点
- **違反ルール**: Render Props Anti-pattern (条件付き)
- **理由**: Render props は柔軟性を提供するが、過度に使用するとコードが読みにくくなる。ただし、このケースでは型安全なジェネリックリストレンダリングのために render props が適切である可能性がある。

## 分析

### 現状の render props が適切な理由
1. **ジェネリクスのサポート**: `T extends SearchableItem` により、異なるデータ型に対応
2. **複雑なコールバック引数**: `lastElementRef` のような DOM 操作用の ref callback を渡す必要がある
3. **インデックスベースの処理**: `isLast` フラグによる最後の要素の特定が必要

### 潜在的な問題
1. **引数が多すぎる**: 6つの引数は多く、型定義が複雑
2. **責務の曖昧さ**: `deleteAction` が渡されるが、カード内で使用するかどうかは `renderCard` 次第

## 推奨される修正

### オプション1: Context + Composition Pattern (推奨)
```tsx
type CardStackContextValue<T> = {
	deleteAction?: DeleteAction;
	registerLastElement: (node: HTMLElement | null) => void;
};

const CardStackContext = createContext<CardStackContextValue<unknown> | null>(null);

export function useCardStackContext() {
	const context = use(CardStackContext);
	if (!context) {
		throw new Error("useCardStackContext must be used within CardStackWrapper");
	}
	return context;
}

type BaseCardStackProps<T extends SearchableItem> = {
	initial: CardStackInitialData<T>;
	deleteAction?: DeleteAction;
	loadMoreAction: LoadMoreAction<CardStackInitialData<T>>;
	children: (items: T[], lastIndex: number) => React.ReactNode;
	gridClassName: string;
};

export function BaseCardStackWrapper<T extends SearchableItem>({
	initial,
	deleteAction,
	loadMoreAction,
	children,
	gridClassName,
}: BaseCardStackProps<T>) {
	const { lastElementRef } = useInfiniteScroll({/* ... */});

	const contextValue: CardStackContextValue<T> = {
		deleteAction,
		registerLastElement: lastElementRef,
	};

	return (
		<CardStackContext.Provider value={contextValue}>
			<div className="px-2 py-4">
				{allData.length === 0 ? (
					<StatusCodeView statusCode="204" statusCodeString={t("204")} />
				) : (
					<div className={gridClassName}>
						{children(allData, allData.length - 1)}
					</div>
				)}
				{isPending && <Loading />}
			</div>
		</CardStackContext.Provider>
	);
}

// 使用例
<BaseCardStackWrapper
	initial={initial}
	deleteAction={deleteAction}
	loadMoreAction={loadMoreAction}
	gridClassName="grid grid-cols-2 gap-4"
>
	{(items, lastIndex) =>
		items.map((item, index) => (
			<ImageCard
				key={item.id}
				data={item}
				basePath={basePath}
				isLast={index === lastIndex}
			/>
		))
	}
</BaseCardStackWrapper>
```

### オプション2: 現状維持
render props パターンはこのユースケースでは適切であり、特に修正の必要はない。ただし、以下の改善を検討:
- 引数をオブジェクトにまとめる
- 型エイリアスを使用して可読性を向上

```tsx
type RenderCardProps<T> = {
	item: T;
	index: number;
	isLast: boolean;
	lastElementRef: (node: HTMLElement | null) => void;
	deleteAction?: DeleteAction;
	key?: string;
};

type BaseCardStackProps<T extends SearchableItem> = {
	// ...
	renderCard: (props: RenderCardProps<T>) => React.ReactNode;
};
```

## メタ情報
- **Priority**: MEDIUM
- **Breaking Change**: Yes (オプション1の場合)
- **作業量**: Medium

## 参考リンク
- [Vercel Composition Patterns - Render Props](https://vercel.com/blog/how-to-write-composable-react-components)
- Render props は適切なユースケースでは有効だが、Composition pattern の方が多くの場合で推奨される
