import {
	makeExportedAt,
	type UserId,
} from "../../shared-kernel/entities/common-entity.js";
import type {
	BulkUpdateResult,
	IBatchCommandRepository,
} from "../../shared-kernel/repositories/batch-command-repository.interface.js";

/**
 * Result of the reset operation.
 */
export type ResetResult = {
	finalized: BulkUpdateResult;
	marked: BulkUpdateResult;
};

/**
 * Domain service for batch operations on Images.
 *
 * @remarks
 * Encapsulates the business logic for batch status transitions.
 * Manages the state machine for image lifecycle:
 *
 * ```
 * UNEXPORTED --> LAST_UPDATED --> EXPORTED
 *                    |
 *                    v
 *               UNEXPORTED (revert)
 * ```
 */
export class ImagesBatchDomainService {
	constructor(private readonly commandRepository: IBatchCommandRepository) {}

	/**
	 * Resets images for a new batch export.
	 */
	public async resetImages(userId: UserId): Promise<ResetResult> {
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
	 * Reverts images from LAST_UPDATED back to UNEXPORTED.
	 */
	public async revertImages(userId: UserId): Promise<BulkUpdateResult> {
		return this.commandRepository.bulkUpdateStatus({
			userId,
			fromStatus: "LAST_UPDATED",
			toStatus: "UNEXPORTED",
		});
	}
}
