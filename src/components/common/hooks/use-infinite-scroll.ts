"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseInfiniteScrollOptions = {
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	fetchNextPage: () => Promise<void>;
	rootMargin?: string;
	threshold?: number;
};

type UseInfiniteScrollReturn = {
	lastElementRef: (node: HTMLElement | null) => void;
};

export function useInfiniteScroll({
	hasNextPage,
	isFetchingNextPage,
	fetchNextPage,
	rootMargin = "100px",
	threshold = 0.1,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
	const observer = useRef<IntersectionObserver | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);

	const lastElementRef = useCallback(
		(node: HTMLElement | null) => {
			if (isFetchingNextPage) return;
			if (observer.current) observer.current.disconnect();

			observer.current = new IntersectionObserver(
				(entries) => {
					if (entries[0]?.isIntersecting && hasNextPage && isInitialized) {
						fetchNextPage();
					}
				},
				{
					rootMargin,
					threshold,
				},
			);

			if (node) observer.current.observe(node);
		},
		[
			isFetchingNextPage,
			hasNextPage,
			fetchNextPage,
			rootMargin,
			threshold,
			isInitialized,
		],
	);

	// Initialize after first render to avoid SSR issues
	useEffect(() => {
		setIsInitialized(true);
	}, []);

	return { lastElementRef };
}
