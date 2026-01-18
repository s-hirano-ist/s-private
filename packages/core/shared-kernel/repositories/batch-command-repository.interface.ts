import type { ExportedAt, Status, UserId } from "../entities/common-entity.js";

/**
 * Result of a bulk update operation.
 *
 * @remarks
 * Represents the number of records affected by a bulk operation.
 * Used by batch domain services to report operation results.
 *
 * @example
 * ```typescript
 * const result = await repository.bulkUpdateStatus(params);
 * console.log(`Updated ${result.count} records`);
 * ```
 */
export type BulkUpdateResult = {
	/** The number of records that were updated */
	count: number;
};

/**
 * Parameters for a status transition operation.
 *
 * @remarks
 * Defines the criteria and target for bulk status updates.
 * Used to transition multiple entities from one status to another.
 *
 * @example
 * ```typescript
 * const params: StatusTransitionParams = {
 *   userId: makeUserId("user-123"),
 *   fromStatus: "UNEXPORTED",
 *   toStatus: "LAST_UPDATED",
 * };
 *
 * // For EXPORTED transitions, include exportedAt
 * const exportParams: StatusTransitionParams = {
 *   userId: makeUserId("user-123"),
 *   fromStatus: "LAST_UPDATED",
 *   toStatus: "EXPORTED",
 *   exportedAt: makeExportedAt(),
 * };
 * ```
 */
export type StatusTransitionParams = {
	/** The user ID for tenant isolation */
	userId: UserId;
	/** The current status of entities to update */
	fromStatus: Status;
	/** The target status to transition to */
	toStatus: Status;
	/** Timestamp for EXPORTED transitions (required when toStatus is "EXPORTED") */
	exportedAt?: ExportedAt;
};

/**
 * Interface for batch command operations on entities.
 *
 * @remarks
 * Provides bulk update capabilities while maintaining DDD principles.
 * Domain services use this interface to perform batch operations.
 *
 * Implementations should:
 * - Use efficient bulk operations (e.g., updateMany in Prisma)
 * - Maintain transactional consistency
 * - Support tenant isolation via userId
 *
 * @example
 * ```typescript
 * class PrismaArticlesBatchRepository implements IBatchCommandRepository {
 *   async bulkUpdateStatus(params: StatusTransitionParams): Promise<BulkUpdateResult> {
 *     const result = await prisma.article.updateMany({
 *       where: { userId: params.userId, status: params.fromStatus },
 *       data: {
 *         status: params.toStatus,
 *         ...(params.exportedAt && { exportedAt: params.exportedAt }),
 *       },
 *     });
 *     return { count: result.count };
 *   }
 * }
 * ```
 *
 * @see {@link StatusTransitionParams} for parameter details
 * @see {@link BulkUpdateResult} for return type
 */
export type IBatchCommandRepository = {
	/**
	 * Updates the status of all entities matching the criteria.
	 *
	 * @param params - The transition parameters
	 * @returns The number of records updated
	 */
	bulkUpdateStatus(params: StatusTransitionParams): Promise<BulkUpdateResult>;
};
