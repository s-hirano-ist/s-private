import {
	makeExportedAt,
	type UserId,
} from "../../shared-kernel/entities/common-entity";
import type {
	BulkUpdateResult,
	IBatchCommandRepository,
	ResetStatusResult,
} from "../../shared-kernel/repositories/batch-command-repository.interface";

/**
 * Result of the reset operation.
 *
 * @remarks
 * Contains the count of articles that were finalized (LAST_UPDATED -> EXPORTED)
 * and marked (UNEXPORTED -> LAST_UPDATED).
 *
 * @deprecated Use {@link ResetStatusResult} from batch-command-repository.interface instead
 */
export type ResetResult = ResetStatusResult;

/**
 * Domain service for batch operations on Articles.
 *
 * @remarks
 * Encapsulates the business logic for batch status transitions.
 * Manages the state machine for article lifecycle:
 *
 * ```
 * UNEXPORTED --> LAST_UPDATED --> EXPORTED
 *                    |
 *                    v
 *               UNEXPORTED (revert)
 * ```
 *
 * @example
 * ```typescript
 * const commandRepo = createArticlesCommandRepository(prisma);
 * const batchService = new ArticlesBatchDomainService(commandRepo);
 *
 * // Reset: finalize previous batch and mark new items
 * const result = await batchService.resetArticles(userId);
 * console.log(`Finalized: ${result.finalized.count}, Marked: ${result.marked.count}`);
 *
 * // Revert: undo the marking if something went wrong
 * const revertResult = await batchService.revertArticles(userId);
 * console.log(`Reverted: ${revertResult.count}`);
 * ```
 *
 * @see {@link IBatchCommandRepository} for repository interface
 * @see {@link ResetResult} for reset operation result
 */
export class ArticlesBatchDomainService {
	/**
	 * Creates a new ArticlesBatchDomainService instance.
	 *
	 * @param commandRepository - The command repository for batch updates
	 */
	constructor(private readonly commandRepository: IBatchCommandRepository) {}

	/**
	 * Resets articles for a new batch export.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @returns The result containing finalized and marked counts
	 *
	 * @remarks
	 * Delegates to repository's resetStatus which performs two operations
	 * atomically within a single transaction:
	 * 1. Finalize: LAST_UPDATED -> EXPORTED (complete previous batch)
	 * 2. Mark: UNEXPORTED -> LAST_UPDATED (prepare current batch)
	 */
	public async resetArticles(userId: UserId): Promise<ResetResult> {
		return this.commandRepository.resetStatus(userId, makeExportedAt());
	}

	/**
	 * Reverts articles from LAST_UPDATED back to UNEXPORTED.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @returns The result containing the count of reverted articles
	 *
	 * @remarks
	 * Used to undo a batch marking if something went wrong.
	 * Only affects articles in LAST_UPDATED status.
	 */
	public async revertArticles(userId: UserId): Promise<BulkUpdateResult> {
		return this.commandRepository.bulkUpdateStatus({
			userId,
			fromStatus: "LAST_UPDATED",
			toStatus: "UNEXPORTED",
		});
	}
}
