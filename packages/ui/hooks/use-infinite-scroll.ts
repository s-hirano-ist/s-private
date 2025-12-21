"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Options for the useInfiniteScroll hook.
 *
 * @see {@link useInfiniteScroll} for the hook
 */
export type UseInfiniteScrollOptions = {
	/** Whether there are more pages to load */
	hasNextPage: boolean;
	/** Whether a page is currently being fetched */
	isFetchingNextPage: boolean;
	/** Function to fetch the next page */
	fetchNextPage: () => Promise<void>;
	/** Margin around the root for intersection detection */
	rootMargin?: string;
	/** Visibility threshold for triggering intersection */
	threshold?: number;
};

/**
 * Return value from the useInfiniteScroll hook.
 *
 * @see {@link useInfiniteScroll} for the hook
 */
export type UseInfiniteScrollReturn = {
	/** Ref callback to attach to the last element */
	lastElementRef: (node: HTMLElement | null) => void;
};

/**
 * Hook for implementing infinite scroll with Intersection Observer.
 *
 * @remarks
 * Automatically loads more content when the last element becomes visible.
 * Uses IntersectionObserver for efficient scroll detection.
 *
 * Features:
 * - Automatic fetch when last element is visible
 * - Prevents duplicate fetches during loading
 * - SSR-safe with delayed initialization
 * - Configurable root margin and threshold
 *
 * @param options - Configuration for pagination and intersection
 * @returns Object containing ref callback for the last element
 *
 * @example
 * ```tsx
 * function ItemList({ items, hasMore, fetchMore }) {
 *   const { lastElementRef } = useInfiniteScroll({
 *     hasNextPage: hasMore,
 *     isFetchingNextPage: false,
 *     fetchNextPage: fetchMore,
 *   });
 *
 *   return (
 *     <ul>
 *       {items.map((item, i) => (
 *         <li
 *           key={item.id}
 *           ref={i === items.length - 1 ? lastElementRef : null}
 *         >
 *           {item.name}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
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
