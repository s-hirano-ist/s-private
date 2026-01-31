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
 * @deprecated Use {@link ResetStatusResult} from batch-command-repository.interface instead
 */
export type ResetResult = ResetStatusResult;

/**
 * Domain service for batch operations on Books.
 *
 * @remarks
 * Encapsulates the business logic for batch status transitions.
 * Manages the state machine for book lifecycle:
 *
 * ```
 * UNEXPORTED --> LAST_UPDATED --> EXPORTED
 *                    |
 *                    v
 *               UNEXPORTED (revert)
 * ```
 */
export class BooksBatchDomainService {
	constructor(private readonly commandRepository: IBatchCommandRepository) {}

	/**
	 * Resets books for a new batch export.
	 *
	 * @remarks
	 * Delegates to repository's resetStatus which performs two operations
	 * atomically within a single transaction.
	 */
	public async resetBooks(userId: UserId): Promise<ResetResult> {
		return this.commandRepository.resetStatus(userId, makeExportedAt());
	}

	/**
	 * Reverts books from LAST_UPDATED back to UNEXPORTED.
	 */
	public async revertBooks(userId: UserId): Promise<BulkUpdateResult> {
		return this.commandRepository.bulkUpdateStatus({
			userId,
			fromStatus: "LAST_UPDATED",
			toStatus: "UNEXPORTED",
		});
	}
}
