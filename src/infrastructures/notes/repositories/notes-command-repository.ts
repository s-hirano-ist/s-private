import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import type { Note } from "@/domains/notes/entities/note-entity";
import type { INotesCommandRepository } from "@/domains/notes/repositories/notes-command-repository.interface";
import { serverLogger } from "@/infrastructures/observability/server";
import prisma from "@/prisma";

class NotesCommandRepository implements INotesCommandRepository {
	async create(data: Note) {
		const response = await prisma.note.create({
			data,
			select: {
				title: true,
				markdown: true,
			},
		});
		serverLogger.info(
			`【NOTES】\n\nノート\ntitle: ${response.title} \nquote: ${response.markdown}\nの登録ができました`,
			{ caller: "addNote", status: 201, userId: data.userId },
			{ notify: true },
		);
	}

	async deleteById(id: Id, userId: UserId, status: Status) {
		const data = await prisma.note.delete({
			where: { id, userId, status },
			select: { title: true },
		});
		serverLogger.info(
			`【NOTES】\n\n削除\ntitle: ${data.title}`,
			{ caller: "deleteNote", status: 200, userId },
			{ notify: true },
		);
	}
}

export const notesCommandRepository = new NotesCommandRepository();
