/**
 * Infrastructure query options for repository queries.
 *
 * @remarks
 * These types encapsulate infrastructure concerns (pagination)
 * that are required for repository interface definitions.
 *
 * While these are infrastructure-related concerns, they are placed in shared-kernel
 * for practical reasons: repository interfaces need to define their parameter types,
 * and separating these would break the dependency injection pattern.
 *
 * See DDD deviation 014 in docs/domain-model.md for architectural rationale.
 *
 * @module
 */

import { z } from "zod";

/**
 * Zod schema for validating pagination count parameters.
 *
 * @remarks
 * Validates currentCount/offset parameters for pagination to prevent:
 * - Negative values
 * - NaN/Infinity values
 * - Excessively large values that could cause DoS
 */
export const paginationCountSchema = z
	.number()
	.int({ message: "mustBeInteger" })
	.min(0, { message: "mustBeNonNegative" })
	.max(10000, { message: "exceedsMaximum" });

/**
 * Pagination parameters for repository queries.
 */
export type PaginationOptions = {
	/** Maximum number of results to return */
	take?: number;
	/** Number of results to skip (for pagination) */
	skip?: number;
};

/**
 * Combined infrastructure query options.
 *
 * @remarks
 * Pagination options for repository findMany operations.
 */
export type InfraQueryOptions = PaginationOptions;
