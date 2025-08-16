"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * タブの可視性を管理するカスタムフック
 * タブが初回表示された時のみtrueになり、以降はタブが切り替わってもtrueのまま
 */
export function useTabVisibility(tabName: string) {
	const searchParams = useSearchParams();
	const [hasBeenVisible, setHasBeenVisible] = useState(false);

	const currentTab = searchParams.get("tab") ?? "news";
	const isCurrentlyVisible = currentTab === tabName;

	useEffect(() => {
		if (isCurrentlyVisible && !hasBeenVisible) {
			setHasBeenVisible(true);
		}
	}, [isCurrentlyVisible, hasBeenVisible]);

	return {
		isVisible: isCurrentlyVisible,
		shouldLoad: hasBeenVisible || isCurrentlyVisible,
	};
}
