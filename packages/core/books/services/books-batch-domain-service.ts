import {
	makeExportedAt,
	type UserId,
} from "../../common/entities/common-entity.js";
import type { BulkUpdateResult } from "../../common/repositories/batch-command-repository.interface.js";
import type { IBooksCommandRepository } from "../repositories/books-command-repository.interface.js";

/**
 * Result of the reset operation.
 */
export type ResetResult = {
	finalized: BulkUpdateResult;
	marked: BulkUpdateResult;
};

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
	constructor(private readonly commandRepository: IBooksCommandRepository) {}

	/**
	 * Resets books for a new batch export.
	 */
	public async resetBooks(userId: UserId): Promise<ResetResult> {
		const finalized = await this.commandRepository.bulkUpdateStatus({
			userId,
			fromStatus: "LAST_UPDATED",
			toStatus: "EXPORTED",
			exportedAt: makeExportedAt(),
		});

		const marked = await this.commandRepository.bulkUpdateStatus({
			userId,
			fromStatus: "UNEXPORTED",
			toStatus: "LAST_UPDATED",
		});

		return { finalized, marked };
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
