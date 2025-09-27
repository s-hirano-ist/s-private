"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * タブの可視性を管理するカスタムフック
 * タブが初回表示された時のみtrueになり、以降はタブが切り替わってもtrueのまま
 * プリローディング機能を含む
 */
export function useTabVisibility(tabName: string, enablePreloading = true) {
	const searchParams = useSearchParams();
	const [hasBeenVisible, setHasBeenVisible] = useState(false);
	const [shouldPreload, setShouldPreload] = useState(false);

	const currentTab = searchParams.get("tab") ?? "articles";
	const isCurrentlyVisible = currentTab === tabName;

	useEffect(() => {
		if (isCurrentlyVisible && !hasBeenVisible) {
			setHasBeenVisible(true);
		}
	}, [isCurrentlyVisible, hasBeenVisible]);

	// Preload adjacent tabs after a delay
	useEffect(() => {
		if (enablePreloading && !shouldPreload && !isCurrentlyVisible) {
			const timer = setTimeout(() => {
				setShouldPreload(true);
			}, 1000); // Preload after 1 second

			return () => clearTimeout(timer);
		}
	}, [enablePreloading, shouldPreload, isCurrentlyVisible]);

	return {
		isVisible: isCurrentlyVisible,
		shouldLoad: hasBeenVisible || isCurrentlyVisible,
		shouldPreload: shouldPreload && enablePreloading,
	};
}
