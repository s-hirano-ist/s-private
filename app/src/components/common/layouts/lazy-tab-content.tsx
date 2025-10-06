"use client";
import { memo, type ReactNode, Suspense } from "react";
import { useTabVisibility } from "@/components/common/hooks/use-tab-visibility";

type Props = {
	tabName: string;
	children: ReactNode;
	fallback?: ReactNode;
	enablePreloading?: boolean;
};

/**
 * タブの遅延読み込み用コンポーネント
 * タブが初回表示されるまでchildrenをレンダリングしない
 * プリローディング機能付き
 */
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
