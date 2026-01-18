/**
 * Loader pattern type definitions.
 *
 * @remarks
 * Loaders are async server components that fetch data and pass it to
 * pure presentation components. They trigger Suspense boundaries and
 * propagate errors to ErrorBoundaries.
 *
 * @module
 */

import type {
	DeleteAction,
	LoadMoreAction,
	ServerAction,
} from "@/common/types";
import type {
	ImageCardStackInitialData,
	LinkCardStackInitialData,
} from "@/components/common/layouts/cards/types";

/**
 * Base props for all loader components.
 */
export type BaseLoaderProps = {
	/** Optional caller name for error tracking */
	errorCaller?: string;
};

/**
 * Props for paginated list loaders using LinkCardStack.
 */
export type PaginatedLinkCardLoaderProps = BaseLoaderProps & {
	/** Optional delete action for each item */
	deleteAction?: DeleteAction;
	/** Action to load more items for infinite scroll */
	loadMoreAction: LoadMoreAction<LinkCardStackInitialData>;
};

/**
 * Props for paginated list loaders using ImageCardStack.
 */
export type PaginatedImageCardLoaderProps = BaseLoaderProps & {
	/** Optional delete action for each item */
	deleteAction?: DeleteAction;
	/** Action to load more items for infinite scroll */
	loadMoreAction: LoadMoreAction<ImageCardStackInitialData>;
};

/**
 * Props for counter badge loaders.
 */
export type CounterLoaderProps = BaseLoaderProps;
