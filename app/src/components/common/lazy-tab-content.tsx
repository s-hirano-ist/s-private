"use client";
import { memo, type ReactNode, Suspense } from "react";
import { type LoadingStrategy, useTabVisibility } from "./use-tab-visibility";

type Props = {
	tabName: string;
	children: ReactNode;
	fallback?: ReactNode;
	loadingStrategy?: LoadingStrategy;
};

// Default values extracted as constants for stable memo comparison
const DEFAULT_FALLBACK = null;
const DEFAULT_LOADING_STRATEGY: LoadingStrategy = "preload";

/**
 * タブの遅延読み込み用コンポーネント
 * タブが初回表示されるまでchildrenをレンダリングしない
 * プリローディング機能付き
 */
function LazyTabContentComponent({
	tabName,
	children,
	fallback = DEFAULT_FALLBACK,
	loadingStrategy = DEFAULT_LOADING_STRATEGY,
}: Props) {
	const { shouldLoad, shouldPreload, isVisible } = useTabVisibility(
		tabName,
		loadingStrategy,
	);

	// Show content immediately if it should be loaded
	if (shouldLoad) {
		return (
			<Suspense fallback={fallback}>
				<div style={{ display: isVisible ? "block" : "none" }}>{children}</div>
			</Suspense>
		);
	}

	// Preload content in background but keep it hidden
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

export const LazyTabContent = memo(LazyTabContentComponent);
