import type {
	Id,
	Status,
	UserId,
} from "../../common/entities/common-entity.js";
import type {
	BulkUpdateResult,
	IBatchCommandRepository,
	StatusTransitionParams,
} from "../../common/repositories/batch-command-repository.interface.js";
import type { UnexportedNote } from "../entities/note-entity.js";

/**
 * Command repository interface for the Note domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles write operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaNotesCommandRepository implements INotesCommandRepository {
 *   async create(data: UnexportedNote) {
 *     await prisma.note.create({ data });
 *   }
 *
 *   async deleteById(id: Id, userId: UserId, status: Status) {
 *     await prisma.note.delete({
 *       where: { id, userId, status }
 *     });
 *   }
 * }
 * ```
 *
 * @see {@link INotesQueryRepository} for read operations
 */
export type INotesCommandRepository = IBatchCommandRepository & {
	/**
	 * Creates a new note in the repository.
	 *
	 * @param data - The unexported note entity to persist
	 */
	create(data: UnexportedNote): Promise<void>;

	/**
	 * Deletes a note by its ID.
	 *
	 * @param id - The note ID to delete
	 * @param userId - The user ID for tenant isolation
	 * @param status - The expected status of the note
	 */
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
};

// Re-export for convenience
export type { BulkUpdateResult, StatusTransitionParams };
