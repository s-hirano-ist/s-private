import type { Status, UserId } from "../../common/entities/common-entity.js";
import type {
	ExportedNote,
	NoteListItemDTO,
	NoteSearchItemDTO,
	NoteTitle,
	UnexportedNote,
} from "../entities/note-entity.js";
import type { NotesFindManyParams } from "../types/query-params.js";

/**
 * Query repository interface for the Note domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles read operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * Return types are either full entities (for single item lookup) or DTOs
 * (for list/search operations) with properly branded types.
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaNotesQueryRepository implements INotesQueryRepository {
 *   async findByTitle(title: NoteTitle, userId: UserId) {
 *     const data = await prisma.note.findUnique({
 *       where: { title, userId }
 *     });
 *     return data ? toNoteEntity(data) : null;
 *   }
 * }
 * ```
 *
 * @see {@link INotesCommandRepository} for write operations
 */
export type INotesQueryRepository = {
	/**
	 * Finds a note by its title for a specific user.
	 *
	 * @param title - The validated title to search for
	 * @param userId - The user ID for tenant isolation
	 * @returns The note entity if found, null otherwise
	 *
	 * @remarks
	 * Returns a full entity type (UnexportedNote or ExportedNote)
	 * for domain operations like duplicate checking.
	 */
	findByTitle(
		title: NoteTitle,
		userId: UserId,
	): Promise<UnexportedNote | ExportedNote | null>;

	/**
	 * Retrieves multiple notes with pagination and filtering.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by UNEXPORTED or EXPORTED status
	 * @param params - Pagination, sorting, and caching parameters
	 * @returns Array of NoteListItemDTO objects
	 *
	 * @see {@link NotesFindManyParams} for parameter options
	 */
	findMany(
		userId: UserId,
		status: Status,
		params: NotesFindManyParams,
	): Promise<NoteListItemDTO[]>;

	/**
	 * Counts notes matching the given criteria.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by status
	 * @returns The count of matching notes
	 */
	count(userId: UserId, status: Status): Promise<number>;

	/**
	 * Searches notes by text query.
	 *
	 * @param query - The search query string
	 * @param userId - The user ID for tenant isolation
	 * @param limit - Optional maximum number of results
	 * @returns Array of NoteSearchItemDTO objects
	 */
	search(
		query: string,
		userId: UserId,
		limit?: number,
	): Promise<NoteSearchItemDTO[]>;
};
