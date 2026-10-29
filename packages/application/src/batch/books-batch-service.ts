import type {
	BulkUpdateResult,
	IBatchCommandRepository,
	ResetStatusResult,
} from "@s-hirano-ist/s-application/batch/ports";
import {
	makeExportedAt,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";

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
export class BooksBatchApplicationService {
	private readonly commandRepository: IBatchCommandRepository;

	constructor(commandRepository: IBatchCommandRepository) {
		this.commandRepository = commandRepository;
	}

	/**
	 * Resets books for a new batch export.
	 *
	 * @remarks
	 * Delegates to repository's resetStatus which performs two operations
	 * atomically within a single transaction.
	 */
	public async resetBooks(userId: UserId): Promise<ResetStatusResult> {
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
