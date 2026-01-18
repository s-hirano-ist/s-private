import { DuplicateError } from "../../errors/error-classes.js";
import type { UserId } from "../../shared-kernel/entities/common-entity.js";
import type { NoteTitle } from "../entities/note-entity.js";
import type { INotesQueryRepository } from "../repositories/notes-query-repository.interface.js";

/**
 * Checks if a note with the given title already exists.
 *
 * @param notesQueryRepository - The query repository to check against
 * @param title - The title to check for duplicates
 * @param userId - The user ID for tenant isolation
 * @throws {DuplicateError} When a note with this title already exists
 *
 * @internal
 */
async function ensureNoDuplicateNote(
	notesQueryRepository: INotesQueryRepository,
	title: NoteTitle,
	userId: UserId,
): Promise<void> {
	const exists = await notesQueryRepository.findByTitle(title, userId);
	if (exists) {
		throw new DuplicateError();
	}
}

/**
 * Domain service for Note business logic.
 *
 * @remarks
 * Encapsulates complex business rules that don't belong to a single entity.
 * Uses dependency injection for repository access.
 *
 * @example
 * ```typescript
 * const queryRepo: INotesQueryRepository = new PrismaNotesQueryRepository();
 * const domainService = new NotesDomainService(queryRepo);
 *
 * try {
 *   await domainService.ensureNoDuplicate(title, userId);
 *   // Safe to create the note
 * } catch (error) {
 *   if (error instanceof DuplicateError) {
 *     // Handle duplicate title
 *   }
 * }
 * ```
 *
 * @see {@link INotesQueryRepository} for repository interface
 * @see {@link DuplicateError} for duplicate handling
 */
export class NotesDomainService {
	/**
	 * Creates a new NotesDomainService instance.
	 *
	 * @param notesQueryRepository - The query repository for checking duplicates
	 */
	constructor(private readonly notesQueryRepository: INotesQueryRepository) {}

	/**
	 * Validates that no note with the same title exists for the user.
	 *
	 * @param title - The title to check for duplicates
	 * @param userId - The user ID for tenant isolation
	 * @throws {DuplicateError} When a note with this title already exists
	 *
	 * @remarks
	 * This is a domain invariant check that should be called before creating notes.
	 */
	public async ensureNoDuplicate(title: NoteTitle, userId: UserId) {
		return ensureNoDuplicateNote(this.notesQueryRepository, title, userId);
	}
}
