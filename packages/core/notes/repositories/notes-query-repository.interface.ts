import type { NoteTitle } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
/** Domain duplication checks need existence, not a reconstructed content lifecycle. */
export type INotesQueryRepository = {
	existsByTitle(key: NoteTitle, userId: UserId): Promise<boolean>;
};
