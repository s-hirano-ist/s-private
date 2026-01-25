import type {
	Id,
	Status,
	UserId,
} from "../../shared-kernel/entities/common-entity.js";
import type { NoteTitle, UnexportedNote } from "../entities/note-entity.js";

/**
 * Command repository interface for the Note domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles write operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * For batch operations (bulkUpdateStatus), use {@link IBatchCommandRepository}
 * from the common module directly.
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
 * @see {@link IBatchCommandRepository} for batch operations
 */
/**
 * Result of a delete operation containing data needed for events.
 */
export type DeleteNoteResult = {
	title: NoteTitle;
};

export type INotesCommandRepository = {
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
	 * @returns The deleted note data needed for domain events
	 */
	deleteById(id: Id, userId: UserId, status: Status): Promise<DeleteNoteResult>;
};
