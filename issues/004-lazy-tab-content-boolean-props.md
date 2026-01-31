# LazyTabContent: Boolean Props の Composition Pattern 違反

## 概要
`LazyTabContent` コンポーネントが `enablePreloading` というboolean propsを使用しており、Vercel Composition Patternsの推奨パターンに反している。

## 対象ファイル
- `app/src/components/common/lazy-tab-content.tsx` (Line 9, 21)

## 現状のコード
```tsx
type Props = {
	tabName: string;
	children: ReactNode;
	fallback?: ReactNode;
	enablePreloading?: boolean;
};

function LazyTabContentComponent({
	tabName,
	children,
	fallback = null,
	enablePreloading = true,
}: Props) {
	const { shouldLoad, shouldPreload, isVisible } = useTabVisibility(
		tabName,
		enablePreloading,
	);

	if (shouldLoad) {
		return (
			<Suspense fallback={fallback}>
				<div style={{ display: isVisible ? "block" : "none" }}>{children}</div>
			</Suspense>
		);
	}

	if (shouldPreload) {
		return (
			<>
				{fallback}
				<div style={{ display: "none" }}>
					<Suspense fallback={null}>{children}</Suspense>
				</div>
			</>
		);
	}

	return <>{fallback}</>;
}
```

## 問題点
- **違反ルール**: Boolean Props Anti-pattern
- **理由**: `enablePreloading` は機能のON/OFFを切り替えるboolean propであり、将来的に複数のプリローディング戦略（eager, lazy, defer等）が必要になった場合に拡張しにくい。

## 推奨される修正

### オプション1: Strategy Pattern (推奨)
```tsx
type LoadingStrategy = "eager" | "lazy" | "preload";

type Props = {
	tabName: string;
	children: ReactNode;
	fallback?: ReactNode;
	loadingStrategy?: LoadingStrategy;
};

function LazyTabContentComponent({
	tabName,
	children,
	fallback = null,
	loadingStrategy = "preload",
}: Props) {
	const enablePreloading = loadingStrategy === "preload";
	const { shouldLoad, shouldPreload, isVisible } = useTabVisibility(
		tabName,
		enablePreloading,
	);
	// ...
}
```

### オプション2: 現状維持の理由
この場合、`enablePreloading` は単純なON/OFF切り替えであり、実際に複数のバリエーションが必要になる可能性は低い。boolean propのままでも許容できるケースとも言える。

ただし、以下の点を考慮:
- propの名前を `preload` に短縮することで、より直感的になる可能性がある
- 将来的な拡張性を考慮する場合は Strategy Pattern を採用

## メタ情報
- **Priority**: HIGH
- **Breaking Change**: Yes (オプション1の場合)
- **作業量**: Small

## 参考リンク
- [Vercel Composition Patterns - Boolean Props](https://vercel.com/blog/how-to-write-composable-react-components)
- Boolean propsが適切な場合もあるが、拡張性を考慮した設計が望ましい
