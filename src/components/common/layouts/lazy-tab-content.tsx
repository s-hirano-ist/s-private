"use client";
import { type ReactNode } from "react";
import { useTabVisibility } from "@/common/hooks/use-tab-visibility";

type Props = {
	tabName: string;
	children: ReactNode;
	fallback?: ReactNode;
};

/**
 * タブの遅延読み込み用コンポーネント
 * タブが初回表示されるまでchildrenをレンダリングしない
 */
export function LazyTabContent({ tabName, children, fallback = null }: Props) {
	const { shouldLoad } = useTabVisibility(tabName);

	if (!shouldLoad) {
		return <>{fallback}</>;
	}

	return <>{children}</>;
}
