import {
	makeExportedAt,
	type UserId,
} from "../../shared-kernel/entities/common-entity.ts";
import type {
	BulkUpdateResult,
	IBatchCommandRepository,
	ResetStatusResult,
} from "../../shared-kernel/repositories/batch-command-repository.interface.ts";

/**
 * Result of the reset operation.
 *
 * @deprecated Use {@link ResetStatusResult} from batch-command-repository.interface instead
 */
export type ResetResult = ResetStatusResult;

/**
 * Domain service for batch operations on Notes.
 *
 * @remarks
 * Encapsulates the business logic for batch status transitions.
 * Manages the state machine for note lifecycle:
 *
 * ```
 * UNEXPORTED --> LAST_UPDATED --> EXPORTED
 *                    |
 *                    v
 *               UNEXPORTED (revert)
 * ```
 */
export class NotesBatchDomainService {
	constructor(private readonly commandRepository: IBatchCommandRepository) {}

	/**
	 * Resets notes for a new batch export.
	 *
	 * @remarks
	 * Delegates to repository's resetStatus which performs two operations
	 * atomically within a single transaction.
	 */
	public async resetNotes(userId: UserId): Promise<ResetResult> {
		return this.commandRepository.resetStatus(userId, makeExportedAt());
	}

	/**
	 * Reverts notes from LAST_UPDATED back to UNEXPORTED.
	 */
	public async revertNotes(userId: UserId): Promise<BulkUpdateResult> {
		return this.commandRepository.bulkUpdateStatus({
			userId,
			fromStatus: "LAST_UPDATED",
			toStatus: "UNEXPORTED",
		});
	}
}
