import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import type { NoteTitle, UnexportedNote } from "../entities/note-entity";

export type INotesCommandRepository = {
	create(data: UnexportedNote): Promise<void>;
	update(title: NoteTitle, userId: UserId, data: UnexportedNote): Promise<void>;
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
};
