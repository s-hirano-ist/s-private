import type { INotesQueryRepository } from "@s-hirano-ist/s-core/notes/repositories/notes-query-repository.interface";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
export function createNotesQueryRepository(
	prisma: Pick<DatabaseClient, "note">,
): INotesQueryRepository {
	return {
		async existsByTitle(title, userId) {
			return (
				(await prisma.note.findUnique({
					where: { title_userId: { title, userId } },
					select: { id: true },
				})) !== null
			);
		},
	};
}
