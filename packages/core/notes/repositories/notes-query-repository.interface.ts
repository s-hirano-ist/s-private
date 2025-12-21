import type { Status, UserId } from "../../common/entities/common-entity";
import type { NoteTitle } from "../entities/note-entity";
import type { NotesFindManyParams } from "../types/query-params";

/**
 * Query repository interface for the Note domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles read operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaNotesQueryRepository implements INotesQueryRepository {
 *   async findByTitle(title: NoteTitle, userId: UserId) {
 *     return await prisma.note.findUnique({
 *       where: { title, userId }
 *     });
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
	 * @returns The note data if found, null otherwise
	 */
	findByTitle(
		title: NoteTitle,
		userId: UserId,
	): Promise<{
		id: string;
		title: string;
		markdown: string;
		status: string;
	} | null>;

	/**
	 * Retrieves multiple notes with pagination and filtering.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by UNEXPORTED or EXPORTED status
	 * @param params - Pagination, sorting, and caching parameters
	 * @returns Array of note data objects
	 *
	 * @see {@link NotesFindManyParams} for parameter options
	 */
	findMany(
		userId: UserId,
		status: Status,
		params: NotesFindManyParams,
	): Promise<Array<{ id: string; title: string }>>;

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
	 * @returns Array of matching note data objects
	 */
	search(
		query: string,
		userId: UserId,
		limit?: number,
	): Promise<
		{
			id: string;
			title: string;
			markdown: string;
		}[]
	>;
};
